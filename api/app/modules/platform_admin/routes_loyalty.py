from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from pymongo import DESCENDING
from pymongo.database import Database

from app.domain import loyalty
from app.modules.platform_admin.deps import get_platform_admin_db
from app.modules.platform_admin.deps_auth import get_current_platform_admin

router = APIRouter(
    prefix="/platform-admin/loyalty",
    tags=["Platform Admin - Loyalty"],
    dependencies=[Depends(get_current_platform_admin)],
)
notifications_router = APIRouter(
    prefix="/platform-admin/notifications",
    tags=["Platform Admin - Notifications"],
    dependencies=[Depends(get_current_platform_admin)],
)


class LoyaltyConfigRequest(BaseModel):
    points_rule_type: str = Field(pattern="^(points_per_currency|percentage_based)$")
    points_earned: float = Field(default=1, ge=0, le=10_000)
    currency_unit: float = Field(default=10, gt=0, le=1_000_000)
    percentage_value: float = Field(default=0, ge=0, le=100)
    first_booking_bonus: int = Field(default=0, ge=0, le=100_000)
    review_bonus_points: int = Field(default=0, ge=0, le=100_000)
    points_expiry_policy: str = "1 Year"

    @field_validator("points_expiry_policy")
    @classmethod
    def validate_expiry(cls, value: str) -> str:
        if value not in loyalty.EXPIRY_POLICIES:
            raise ValueError(f"Expiry must be one of: {', '.join(loyalty.EXPIRY_POLICIES)}.")
        return value


class LoyaltyReviewRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


def _vendor_oid(vendor_id: str) -> ObjectId:
    try:
        return ObjectId(vendor_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service provider id.")


@router.get("/config")
def get_loyalty_config(db: Database = Depends(get_platform_admin_db)) -> dict:
    return loyalty.get_config(db)


@router.put("/config")
def update_loyalty_config(
    payload: LoyaltyConfigRequest,
    db: Database = Depends(get_platform_admin_db),
    admin: dict = Depends(get_current_platform_admin),
) -> dict:
    return loyalty.save_config(db, payload.model_dump(), str(admin.get("id") or admin.get("_id") or ""))


@router.get("/providers")
def list_loyalty_providers(db: Database = Depends(get_platform_admin_db)) -> dict:
    return {"items": loyalty.list_enrollments(db), "min_active_days": loyalty.MIN_ACTIVE_DAYS}


@router.post("/providers/{vendor_id}/approve")
def approve_loyalty_provider(
    vendor_id: str,
    db: Database = Depends(get_platform_admin_db),
    admin: dict = Depends(get_current_platform_admin),
) -> dict:
    try:
        return loyalty.review_request(db, _vendor_oid(vendor_id), True, admin_id=str(admin.get("id") or ""))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/providers/{vendor_id}/reject")
def reject_loyalty_provider(
    vendor_id: str,
    payload: LoyaltyReviewRequest,
    db: Database = Depends(get_platform_admin_db),
    admin: dict = Depends(get_current_platform_admin),
) -> dict:
    try:
        return loyalty.review_request(db, _vendor_oid(vendor_id), False, payload.reason, admin_id=str(admin.get("id") or ""))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@notifications_router.get("")
def list_admin_notifications(db: Database = Depends(get_platform_admin_db)) -> dict:
    rows = db[loyalty.ADMIN_NOTIFICATIONS].find({}).sort("created_at", DESCENDING).limit(30)
    items = [
        {
            "id": str(row["_id"]),
            "type": row.get("type"),
            "title": row.get("title") or "",
            "message": row.get("message") or "",
            "link": row.get("link"),
            "read": bool(row.get("read")),
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        }
        for row in rows
    ]
    unread = db[loyalty.ADMIN_NOTIFICATIONS].count_documents({"read": False})
    return {"items": items, "unread": unread}


@notifications_router.post("/read-all")
def mark_admin_notifications_read(db: Database = Depends(get_platform_admin_db)) -> dict:
    db[loyalty.ADMIN_NOTIFICATIONS].update_many({"read": False}, {"$set": {"read": True}})
    return {"unread": 0}
