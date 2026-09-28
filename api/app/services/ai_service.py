import logging

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.ai.client import LLMClient
from app.ai.prompt_templates import SYSTEM_PROMPT, build_planner_prompt
from app.ai.schemas import AIPlan, ItineraryStep
from app.domain.enums import ListingType
from app.models.ai import AIPlanRequest
from app.repositories.listing_repository import ListingRepository

logger = logging.getLogger("nunos.ai")

# Candidate categories to try first for each plan mood when the AI is unavailable.
FALLBACK_CATEGORY_ORDER = {
    "chill": ["restaurants", "spas", "happy_hours", "hotels", "events"],
    "party": ["happy_hours", "events", "restaurants", "hotels", "spas"],
    "active": ["events", "restaurants", "happy_hours", "spas", "hotels"],
    "fancy": ["restaurants", "hotels", "spas", "events", "happy_hours"],
}
FALLBACK_TIMES = ["18:00", "19:30", "21:00"]


class AIPlannerService:
    def __init__(self, listing_repo: ListingRepository, llm_client: LLMClient):
        self.listing_repo = listing_repo
        self.llm_client = llm_client

    async def create_plan(self, payload: AIPlanRequest) -> AIPlan:
        preferences = payload.preferences or [
            ListingType.restaurant,
            ListingType.event,
            ListingType.spa,
            ListingType.hotel,
        ]

        candidates: dict[str, list[dict]] = {}
        for listing_type in preferences:
            docs = await self.listing_repo.top_by_type(
                listing_type.value,
                limit=5,
                near_metro=payload.near_metro,
                offers=payload.offers,
            )
            candidates[listing_type.value] = [
                {
                    "id": str(doc["_id"]),
                    "name": doc["name"],
                    "type": doc["type"],
                    "near_metro_station": doc.get("near_metro_station"),
                    "price_level": doc.get("price_level"),
                    "has_offers": doc.get("has_offers", False),
                    "rating": doc.get("rating_summary", {}).get("average", 0),
                }
                for doc in docs
            ]

        user_input = payload.model_dump(mode="json")
        prompt = build_planner_prompt(user_input, candidates)

        try:
            llm_json = await self.llm_client.generate_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI provider failed: {exc}",
            ) from exc

        try:
            return AIPlan.model_validate(llm_json)
        except ValidationError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Invalid AI output: {exc}") from exc

    async def create_plan_from_context(self, user_context: dict, candidates: dict[str, list[dict]]) -> AIPlan:
        """Generate a plan from the authenticated customer's current Nuno data."""
        prompt = build_planner_prompt(user_context, candidates)
        try:
            llm_json = await self.llm_client.generate_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
            return AIPlan.model_validate(llm_json)
        except Exception as exc:
            logger.warning("AI planner unavailable, using fallback plan: %s", exc)
            return self._fallback_plan(user_context, candidates)

    @staticmethod
    def _fallback_plan(user_context: dict, candidates: dict[str, list[dict]]) -> AIPlan:
        """Build a simple rule-based plan from the same candidates the AI would see."""
        preferences = user_context.get("plan_preferences") or {}
        mood = str(preferences.get("mood") or "").strip()
        budget = str(preferences.get("budget") or "moderate")
        area = str((preferences.get("preferences") or {}).get("area") or "Anywhere")

        order = FALLBACK_CATEGORY_ORDER.get(mood.lower(), FALLBACK_CATEGORY_ORDER["chill"])
        picks: list[dict] = []
        for category in order:
            item = next((row for row in candidates.get(category, []) if row.get("name")), None)
            if item:
                picks.append(item)
            if len(picks) == len(FALLBACK_TIMES):
                break

        steps = [
            ItineraryStep(
                time=time,
                title=f"Visit {item['name']}",
                listing_id=str(item["id"]) if item.get("id") else None,
                listing_name=item["name"],
                note=item.get("offer_text") or item.get("location"),
            )
            for time, item in zip(FALLBACK_TIMES, picks)
        ]
        if not steps:
            steps = [
                ItineraryStep(time="18:00", title="Grab a bite at a local favourite", note="Check Explore for nearby places"),
                ItineraryStep(time="19:30", title="Take a relaxed evening stroll"),
                ItineraryStep(time="21:00", title="Wind down with dessert or coffee"),
            ]

        vibe = f"{mood} " if mood else ""
        where = "" if area.lower() == "anywhere" else f" around {area}"
        return AIPlan(
            summary=f"A {vibe}plan{where} picked from places near you.",
            estimated_budget=budget,
            steps=steps,
        )
