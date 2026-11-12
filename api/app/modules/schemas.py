from typing import Any

from pydantic import BaseModel, Field


class PlannedEndpointResponse(BaseModel):
    status: str = "planned"
    endpoint: str
    module: str
    description: str
    connected_from: list[str] = Field(default_factory=list)


class GenericPatchRequest(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)


class StatusUpdateRequest(BaseModel):
    status: str
    note: str | None = None


class MessageCreateRequest(BaseModel):
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class BookingCreateRequest(BaseModel):
    provider_id: str
    provider_type: str
    service_id: str | None = None
    room_id: str | None = None
    event_id: str | None = None
    date: str
    time: str
    guests: int = Field(ge=1, le=20)
    notes: str | None = None


class PlanForMeStepRequest(BaseModel):
    value: str | int | bool | dict[str, Any] | list[str]


class PlanRefineRequest(BaseModel):
    """A change the customer asks for on one generated plan, e.g. "add a spa" or "swap dinner"."""

    plan_index: int = Field(ge=0, le=9)
    request: str = Field(min_length=2, max_length=300)
    # The plan as the app shows it (stops may have been removed there). Its places are re-checked
    # against the real candidates, so the client can't add places that don't exist.
    plan: dict[str, Any] | None = None


class AssetUploadRequest(BaseModel):
    asset_url: str
    asset_type: str
    caption: str | None = None

