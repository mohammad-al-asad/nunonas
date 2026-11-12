import asyncio

import pytest
from fastapi import HTTPException

from app.services.ai_service import AIPlannerService

CANDIDATES = {
    "restaurants": [{"id": "r1", "name": "Spice Garden", "type": "restaurant"}],
    "spas": [{"id": "s1", "name": "Lotus Spa", "type": "spa"}],
}
CURRENT = {
    "title": "Easy evening",
    "summary": "Dinner out.",
    "estimated_budget": "moderate",
    "steps": [{"time": "19:00", "title": "Dinner at Spice Garden", "listing_id": "r1", "listing_name": "Spice Garden"}],
}


class FakeLLM:
    def __init__(self, reply):
        self.reply = reply
        self.prompt = ""

    async def generate_json(self, *, prompt, system_prompt):
        self.prompt = prompt
        if isinstance(self.reply, Exception):
            raise self.reply
        return self.reply


def _refine(llm, request="Add a spa before dinner"):
    return asyncio.run(AIPlannerService(None, llm).refine_plan({}, CANDIDATES, CURRENT, request))


def test_refine_adds_a_real_candidate_and_drops_invented_places():
    llm = FakeLLM(
        {
            "title": "Relax then dine",
            "summary": "A spa, then dinner.",
            "estimated_budget": "moderate",
            "steps": [
                {"time": "16:00", "title": "Massage at Lotus Spa", "listing_id": "s1", "listing_name": "Lotus Spa"},
                {"time": "17:30", "title": "Made-up bar", "listing_id": "nope", "listing_name": "Ghost Bar"},
                {"time": "19:00", "title": "Dinner at Spice Garden", "listing_id": "r1", "listing_name": "Spice Garden"},
            ],
        }
    )

    plan = _refine(llm)

    assert [step.listing_id for step in plan.steps] == ["s1", "r1"]
    assert plan.steps[0].listing_type == "spa"
    assert "Add a spa before dinner" in llm.prompt
    assert "Dinner at Spice Garden" in llm.prompt  # the current plan is sent along


def test_refine_reports_a_friendly_error_when_the_ai_fails():
    with pytest.raises(HTTPException) as error:
        _refine(FakeLLM(RuntimeError("timeout")))

    assert error.value.status_code == 503
