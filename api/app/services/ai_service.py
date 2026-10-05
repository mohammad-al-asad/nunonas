import logging

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.ai.client import LLMClient
from app.ai.prompt_templates import SYSTEM_PROMPT, build_plan_options_prompt, build_planner_prompt
from app.ai.schemas import AIPlan, AIPlanOptions, ItineraryStep
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
FALLBACK_TITLES = ["Your easy evening", "Something different"]
PLAN_OPTION_COUNT = 2


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

    async def create_plan_options_from_context(
        self, user_context: dict, candidates: dict[str, list[dict]], count: int = PLAN_OPTION_COUNT
    ) -> list[AIPlan]:
        """Generate `count` alternative plans from the authenticated customer's current Nuno data."""
        prompt = build_plan_options_prompt(user_context, candidates, count)
        try:
            llm_json = await self.llm_client.generate_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
            plans = AIPlanOptions.model_validate(llm_json).plans[:count]
            plans = [self._attach_listings(plan, candidates) for plan in plans]
            plans = [plan for plan in plans if plan.steps]
            if not plans:
                raise ValueError("AI returned no usable plans")
        except Exception as exc:
            logger.warning("AI planner unavailable, using fallback plans: %s", exc)
            return self._fallback_plans(user_context, candidates, count)
        # Top up with rule-based plans if the model returned fewer than requested.
        if len(plans) < count:
            plans += self._fallback_plans(user_context, candidates, count)[len(plans):]
        return plans

    @staticmethod
    def _attach_listings(plan: AIPlan, candidates: dict[str, list[dict]]) -> AIPlan:
        """Keep steps that point at real candidates and copy display details from them."""
        by_id = {str(row["id"]): row for rows in candidates.values() for row in rows if row.get("id")}
        steps = []
        for step in plan.steps:
            listing = by_id.get(str(step.listing_id or ""))
            if listing is None:
                continue  # never show places the model invented
            steps.append(_step_with_listing(step, listing))
        return plan.model_copy(update={"steps": steps})

    @staticmethod
    def _fallback_plans(user_context: dict, candidates: dict[str, list[dict]], count: int) -> list[AIPlan]:
        """Build simple rule-based plans from the same candidates the AI would see."""
        preferences = user_context.get("plan_preferences") or {}
        mood = str(preferences.get("mood") or "").strip()
        budget = str(preferences.get("budget") or "moderate")
        area = str((preferences.get("preferences") or {}).get("area") or "Anywhere")
        where = "" if area.lower() == "anywhere" else f" around {area}"

        orders = [FALLBACK_CATEGORY_ORDER.get(mood.lower(), FALLBACK_CATEGORY_ORDER["chill"])]
        orders += [order for key, order in FALLBACK_CATEGORY_ORDER.items() if order not in orders]

        plans: list[AIPlan] = []
        used: set[str] = set()
        for index, order in enumerate(orders):
            picks: list[dict] = []
            for category in order:
                # Prefer places the earlier plans didn't use, so the options differ.
                rows = [row for row in candidates.get(category, []) if row.get("name")]
                item = next((row for row in rows if str(row.get("id")) not in used), None) or (rows[0] if rows else None)
                if item and item not in picks:
                    picks.append(item)
                if len(picks) == len(FALLBACK_TIMES):
                    break
            if not picks:
                continue
            used.update(str(item.get("id")) for item in picks)
            steps = [
                _step_with_listing(
                    ItineraryStep(time=time, title=f"Visit {item['name']}", listing_id=str(item.get("id") or ""), listing_name=item["name"], note=item.get("offer_text")),
                    item,
                )
                for time, item in zip(FALLBACK_TIMES, picks)
            ]
            vibe = f"{mood} " if mood and index == 0 else ""
            plans.append(
                AIPlan(
                    title=FALLBACK_TITLES[index % len(FALLBACK_TITLES)],
                    summary=f"A {vibe}plan{where} picked from places near you.",
                    estimated_budget=budget,
                    steps=steps,
                )
            )
            if len(plans) == count:
                break

        if not plans:
            plans.append(
                AIPlan(
                    title="Evening out",
                    summary="We couldn't find places near you yet, so here's a simple idea.",
                    estimated_budget=budget,
                    steps=[
                        ItineraryStep(time="18:00", title="Grab a bite at a local favourite", note="Check Explore for nearby places"),
                        ItineraryStep(time="19:30", title="Take a relaxed evening stroll"),
                        ItineraryStep(time="21:00", title="Wind down with dessert or coffee"),
                    ],
                )
            )
        return plans


def _step_with_listing(step: ItineraryStep, listing: dict) -> ItineraryStep:
    return step.model_copy(
        update={
            "listing_id": str(listing.get("id") or step.listing_id or "") or None,
            "listing_name": listing.get("name") or step.listing_name,
            "listing_type": listing.get("type"),
            "image_url": listing.get("image_url"),
            "location": listing.get("location"),
            "detail_route": listing.get("detail_route"),
            "note": step.note or listing.get("offer_text"),
        }
    )
