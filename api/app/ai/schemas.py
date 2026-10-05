from datetime import UTC, datetime

from pydantic import BaseModel, Field


class ItineraryStep(BaseModel):
    time: str
    title: str
    listing_id: str | None = None
    listing_name: str | None = None
    note: str | None = None
    # Filled in by the backend from the matched candidate (not by the model).
    listing_type: str | None = None
    image_url: str | None = None
    location: str | None = None
    detail_route: str | None = None


class BookingSuggestion(BaseModel):
    booking_type: str
    listing_id: str
    reason: str


class AIPlan(BaseModel):
    title: str = ""
    summary: str
    estimated_budget: str
    steps: list[ItineraryStep] = Field(default_factory=list)
    booking_suggestions: list[BookingSuggestion] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AIPlanOptions(BaseModel):
    """Alternative plans the customer can choose between (Plan for me)."""

    plans: list[AIPlan] = Field(default_factory=list)
