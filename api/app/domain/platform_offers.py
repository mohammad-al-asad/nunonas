"""Platform offers: campaigns the admin creates that each provider accepts or rejects.

An offer is fixed once created (no edits, no early end). Every approved provider
sees it on their Offers page and decides once; an accepted offer discounts that
provider's bookings during the offer period.
"""

from datetime import UTC, date, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

OFFERS = "platform_offers"
RESPONSES = "platform_offer_responses"
VENDOR_NOTIFICATIONS = "vendor_notifications"
DISCOUNT_TYPES = ("percentage", "fixed_amount")
ELIGIBLE_VENDORS = {"$or": [{"status": "approved"}, {"status": "active"}, {"status": {"$exists": False}}]}


def ensure_indexes(db: Database) -> None:
    db[RESPONSES].create_index([("offer_id", 1), ("vendor_id", 1)], unique=True)
    db[RESPONSES].create_index("vendor_id")
    db[OFFERS].create_index([("end_date", 1), ("start_date", 1)])


def _oid(value: Any) -> ObjectId:
    try:
        return value if isinstance(value, ObjectId) else ObjectId(str(value))
    except (InvalidId, TypeError) as exc:
        raise ValueError("Offer not found.") from exc


def _parse_day(value: Any, field: str) -> str:
    try:
        return date.fromisoformat(str(value or "").strip()[:10]).isoformat()
    except ValueError as exc:
        raise ValueError(f"{field} must be a date (YYYY-MM-DD).") from exc


def today() -> str:
    return datetime.now(UTC).date().isoformat()


def state(offer: dict[str, Any], day: str | None = None) -> str:
    day = day or today()
    if day < offer["start_date"]:
        return "upcoming"
    if day > offer["end_date"]:
        return "ended"
    return "live"


def discount_label(offer: dict[str, Any]) -> str:
    value = float(offer.get("discount_value") or 0)
    return f"{value:g}% off" if offer.get("discount_type") == "percentage" else f"{value:g} off"


def serialize(offer: dict[str, Any], day: str | None = None) -> dict[str, Any]:
    return {
        "id": str(offer["_id"]),
        "name": offer.get("name") or "",
        "purpose": offer.get("purpose") or "",
        "discount_type": offer.get("discount_type"),
        "discount_value": float(offer.get("discount_value") or 0),
        "discount_label": discount_label(offer),
        "start_date": offer.get("start_date"),
        "end_date": offer.get("end_date"),
        "state": state(offer, day),
        "created_at": offer["created_at"].isoformat() if isinstance(offer.get("created_at"), datetime) else None,
    }


def eligible_vendors(db: Database) -> list[dict[str, Any]]:
    return list(db["vendors"].find(ELIGIBLE_VENDORS, {"business_name": 1, "email": 1, "owner_full_name": 1, "categories": 1, "category": 1}))


def create_offer(db: Database, payload: dict[str, Any], admin_id: str | None = None) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Create an offer and notify every provider in the portal.

    Returns the offer and the providers to email (the caller sends email in the background).
    """
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("Offer name is required.")
    purpose = str(payload.get("purpose") or "").strip()
    if not purpose:
        raise ValueError("Purpose is required.")
    discount_type = str(payload.get("discount_type") or "").strip().lower()
    if discount_type not in DISCOUNT_TYPES:
        raise ValueError("Discount type must be percentage or fixed amount.")
    try:
        discount_value = float(payload.get("discount_value"))
    except (TypeError, ValueError) as exc:
        raise ValueError("Discount value is required.") from exc
    if discount_value <= 0 or (discount_type == "percentage" and discount_value > 100):
        raise ValueError("Discount must be above 0 (and at most 100 for a percentage).")
    start_date = _parse_day(payload.get("start_date"), "Start date")
    end_date = _parse_day(payload.get("end_date"), "End date")
    if end_date < start_date:
        raise ValueError("End date must be on or after the start date.")
    if end_date < today():
        raise ValueError("End date cannot be in the past.")

    now = datetime.now(UTC)
    doc = {
        "name": name,
        "purpose": purpose,
        "discount_type": discount_type,
        "discount_value": discount_value,
        "start_date": start_date,
        "end_date": end_date,
        "created_at": now,
        "created_by": admin_id,
    }
    doc["_id"] = db[OFFERS].insert_one(doc).inserted_id

    vendors = eligible_vendors(db)
    if vendors:
        db[VENDOR_NOTIFICATIONS].insert_many(
            [
                {
                    "vendor_id": vendor["_id"],
                    "type": "platform_offer",
                    "title": f"New platform offer: {name}",
                    "message": f"{discount_label(doc)} from {start_date} to {end_date}. {purpose} Accept or reject it on your Offers page.",
                    "read": False,
                    "action_type": "mark_read",
                    "action_label": "Mark as Read",
                    "metadata": {"link": "/promotions", "offer_id": str(doc["_id"])},
                    "created_at": now,
                    "updated_at": now,
                }
                for vendor in vendors
            ]
        )
    return serialize(doc), vendors


def _responses_by_offer(db: Database, offer_ids: list[ObjectId]) -> dict[ObjectId, dict[ObjectId, dict[str, Any]]]:
    rows: dict[ObjectId, dict[ObjectId, dict[str, Any]]] = {}
    for response in db[RESPONSES].find({"offer_id": {"$in": offer_ids}}):
        rows.setdefault(response["offer_id"], {})[response["vendor_id"]] = response
    return rows


def list_for_admin(db: Database) -> list[dict[str, Any]]:
    offers = list(db[OFFERS].find().sort("created_at", -1))
    responses = _responses_by_offer(db, [offer["_id"] for offer in offers])
    vendor_ids = {vendor["_id"] for vendor in eligible_vendors(db)}
    rows = []
    for offer in offers:
        answered = responses.get(offer["_id"], {})
        accepted = sum(1 for row in answered.values() if row["status"] == "accepted")
        rejected = sum(1 for row in answered.values() if row["status"] == "rejected")
        rows.append(
            {
                **serialize(offer),
                "accepted": accepted,
                "rejected": rejected,
                "pending": len(vendor_ids - set(answered)),
                "bookings": db["vendor_bookings"].count_documents({"platform_offer_id": offer["_id"], "status": {"$nin": ["canceled", "cancelled"]}}),
            }
        )
    return rows


def admin_detail(db: Database, offer_id: str) -> dict[str, Any] | None:
    offer = db[OFFERS].find_one({"_id": _oid(offer_id)})
    if not offer:
        return None
    answered = _responses_by_offer(db, [offer["_id"]]).get(offer["_id"], {})
    providers = []
    for vendor in eligible_vendors(db):
        response = answered.get(vendor["_id"])
        providers.append(
            {
                "vendor_id": str(vendor["_id"]),
                "business_name": vendor.get("business_name") or vendor.get("owner_full_name") or "Provider",
                "status": response["status"] if response else "pending",
                "responded_at": response["responded_at"].isoformat() if response else None,
                "bookings": db["vendor_bookings"].count_documents(
                    {"platform_offer_id": offer["_id"], "vendor_id": vendor["_id"], "status": {"$nin": ["canceled", "cancelled"]}}
                ),
            }
        )
    order = {"accepted": 0, "pending": 1, "rejected": 2}
    providers.sort(key=lambda row: (order[row["status"]], row["business_name"].lower()))
    return {**serialize(offer), "providers": providers}


def list_for_vendor(db: Database, vendor_id: str) -> list[dict[str, Any]]:
    vendor_oid = _oid(vendor_id)
    day = today()
    offers = list(db[OFFERS].find().sort("start_date", -1))
    responses = {row["offer_id"]: row for row in db[RESPONSES].find({"vendor_id": vendor_oid})}
    rows = []
    for offer in offers:
        response = responses.get(offer["_id"])
        current = state(offer, day)
        # Ended offers the provider never joined are just noise.
        if current == "ended" and not (response and response["status"] == "accepted"):
            continue
        rows.append(
            {
                **serialize(offer, day),
                "response": response["status"] if response else "pending",
                "responded_at": response["responded_at"].isoformat() if response else None,
                "can_respond": response is None and current != "ended",
            }
        )
    return rows


def respond(db: Database, vendor_id: str, offer_id: str, accept: bool) -> dict[str, Any]:
    vendor_oid = _oid(vendor_id)
    offer = db[OFFERS].find_one({"_id": _oid(offer_id)})
    if not offer:
        raise LookupError("Offer not found.")
    if state(offer) == "ended":
        raise ValueError("This offer has ended.")
    try:
        db[RESPONSES].insert_one(
            {
                "offer_id": offer["_id"],
                "vendor_id": vendor_oid,
                "status": "accepted" if accept else "rejected",
                "responded_at": datetime.now(UTC),
            }
        )
    except DuplicateKeyError as exc:
        raise ValueError("You have already responded to this offer.") from exc
    return next(row for row in list_for_vendor(db, vendor_id) if row["id"] == str(offer["_id"]))


def accepted_offers(db: Database, vendor_id: ObjectId, day: str) -> list[dict[str, Any]]:
    """Offers this provider accepted that run on ``day`` (YYYY-MM-DD)."""
    offer_ids = [row["offer_id"] for row in db[RESPONSES].find({"vendor_id": vendor_id, "status": "accepted"}, {"offer_id": 1})]
    if not offer_ids:
        return []
    return list(db[OFFERS].find({"_id": {"$in": offer_ids}, "start_date": {"$lte": day}, "end_date": {"$gte": day}}))


def live_offers_with_providers(db: Database) -> list[tuple[dict[str, Any], list[ObjectId]]]:
    """Live offers that at least one provider accepted, with those providers' ids."""
    day = today()
    offers = list(db[OFFERS].find({"start_date": {"$lte": day}, "end_date": {"$gte": day}}).sort("end_date", 1))
    responses = _responses_by_offer(db, [offer["_id"] for offer in offers])
    result = []
    for offer in offers:
        vendor_ids = [vendor_id for vendor_id, row in responses.get(offer["_id"], {}).items() if row["status"] == "accepted"]
        if vendor_ids:
            result.append((offer, vendor_ids))
    return result
