import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field
from pymongo.database import Database

from app.api.deps import get_email_sender
from app.domain import platform_offers
from app.modules.platform_admin.deps import get_platform_admin_db
from app.modules.platform_admin.deps_auth import get_current_platform_admin
from app.providers.email_sender import EmailSender

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/platform-admin/offers",
    tags=["Platform Admin - Offers"],
    dependencies=[Depends(get_current_platform_admin)],
)


class PlatformOfferCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    purpose: str = Field(min_length=1, max_length=500)
    discount_type: str = Field(pattern="^(percentage|fixed_amount)$")
    discount_value: float = Field(gt=0)
    start_date: str
    end_date: str


def _email_providers(sender: EmailSender, offer: dict, vendors: list[dict]) -> None:
    lines = [
        f"There is a new platform offer: {offer['name']}.",
        "",
        f"Discount: {offer['discount_label']} on bookings",
        f"Runs: {offer['start_date']} to {offer['end_date']}",
        f"Purpose: {offer['purpose']}",
        "",
        "Open the Offers page in your provider portal to accept or reject it.",
    ]
    for vendor in vendors:
        email = vendor.get("email")
        if not email:
            continue
        try:
            sender.send_message(
                email,
                vendor.get("owner_full_name") or vendor.get("business_name") or "there",
                f"New platform offer: {offer['name']}",
                lines,
            )
        except Exception:  # One failed address must not stop the rest.
            logger.warning("Could not email platform offer %s to vendor %s", offer["id"], vendor.get("_id"))


@router.get("")
def list_platform_offers(db: Database = Depends(get_platform_admin_db)) -> dict:
    return {"offers": platform_offers.list_for_admin(db)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_platform_offer(
    payload: PlatformOfferCreateRequest,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_platform_admin_db),
    admin: dict = Depends(get_current_platform_admin),
    sender: EmailSender = Depends(get_email_sender),
) -> dict:
    platform_offers.ensure_indexes(db)
    try:
        offer, vendors = platform_offers.create_offer(db, payload.model_dump(), admin_id=str(admin.get("id") or ""))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    background_tasks.add_task(_email_providers, sender, offer, vendors)
    return offer


@router.get("/{offer_id}")
def get_platform_offer(offer_id: str, db: Database = Depends(get_platform_admin_db)) -> dict:
    try:
        offer = platform_offers.admin_detail(db, offer_id)
    except ValueError:
        offer = None
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")
    return offer
