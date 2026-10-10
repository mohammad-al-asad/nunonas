"""Platform loyalty program.

The platform admin owns the earning rules (one configuration for every provider).
A provider only switches the program on or off for its business:

    off / rejected --(provider turns on)--> pending --(admin approves)--> active
                                                  \\--(admin rejects)--> rejected
    pending --(provider cancels)--> off
    active  --(provider turns off, at least MIN_ACTIVE_DAYS after approval)--> off

Points are only awarded for bookings and reviews at providers whose program is active.
Uses the sync pymongo database (vendor portal and platform admin repositories).
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from pymongo.database import Database

CONFIG_COLLECTION = "platform_loyalty_config"
CONFIG_ID = "config"
ENROLLMENT_COLLECTION = "vendor_loyalty_settings"
ADMIN_NOTIFICATIONS = "platform_admin_notifications"
VENDOR_NOTIFICATIONS = "vendor_notifications"

MIN_ACTIVE_DAYS = 30
STATUSES = ("off", "pending", "active", "rejected")
EXPIRY_POLICIES = ("1 Year", "2 Years", "No Expiry")

DEFAULT_CONFIG: dict[str, Any] = {
    "points_rule_type": "points_per_currency",
    "points_earned": 1.0,
    "currency_unit": 10.0,
    "percentage_value": 0.0,
    "first_booking_bonus": 0,
    "review_bonus_points": 0,
    "points_expiry_policy": "1 Year",
}


def _aware(value: Any) -> datetime | None:
    if not isinstance(value, datetime):
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _iso(value: Any) -> str | None:
    moment = _aware(value)
    return moment.isoformat() if moment else None


# ---------------------------------------------------------------------------
# Platform rules (admin)
# ---------------------------------------------------------------------------


def get_config(db: Database) -> dict[str, Any]:
    stored = db[CONFIG_COLLECTION].find_one({"_id": CONFIG_ID}) or {}
    config = {key: stored.get(key, default) for key, default in DEFAULT_CONFIG.items()}
    config["updated_at"] = _iso(stored.get("updated_at"))
    return config


def save_config(db: Database, payload: dict[str, Any], admin_id: str | None = None) -> dict[str, Any]:
    values = {key: payload[key] for key in DEFAULT_CONFIG if key in payload}
    db[CONFIG_COLLECTION].update_one(
        {"_id": CONFIG_ID},
        {"$set": {**values, "updated_at": datetime.now(UTC), "updated_by": admin_id}},
        upsert=True,
    )
    return get_config(db)


# ---------------------------------------------------------------------------
# Provider enrollment
# ---------------------------------------------------------------------------


def _enrollment_doc(db: Database, vendor_id: ObjectId) -> dict[str, Any]:
    return db[ENROLLMENT_COLLECTION].find_one({"vendor_id": vendor_id}) or {}


def _status_of(doc: dict[str, Any]) -> str:
    status = str(doc.get("status") or "")
    if status in STATUSES:
        return status
    # Before admin approval existed, providers switched the program on themselves.
    return "active" if doc.get("enable_loyalty_program") is True else "off"


def _active_since(doc: dict[str, Any]) -> datetime | None:
    return _aware(doc.get("approved_at")) or _aware(doc.get("updated_at")) or _aware(doc.get("created_at"))


def enrollment(db: Database, vendor_id: ObjectId | str) -> dict[str, Any]:
    doc = _enrollment_doc(db, ObjectId(vendor_id))
    status = _status_of(doc)
    active_since = _active_since(doc) if status == "active" else None
    can_turn_off_at = active_since + timedelta(days=MIN_ACTIVE_DAYS) if active_since else None
    return {
        "status": status,
        "requested_at": _iso(doc.get("requested_at")),
        "approved_at": _iso(active_since),
        "reviewed_at": _iso(doc.get("reviewed_at")),
        "rejection_reason": doc.get("rejection_reason") if status == "rejected" else None,
        "can_turn_off_at": _iso(can_turn_off_at),
        "min_active_days": MIN_ACTIVE_DAYS,
    }


def is_active(db: Database, vendor_id: ObjectId | str) -> bool:
    return _status_of(_enrollment_doc(db, ObjectId(vendor_id))) == "active"


def _set_status(db: Database, vendor_id: ObjectId, status: str, extra: dict[str, Any] | None = None) -> None:
    now = datetime.now(UTC)
    db[ENROLLMENT_COLLECTION].update_one(
        {"vendor_id": vendor_id},
        {
            "$set": {"status": status, "enable_loyalty_program": status == "active", "updated_at": now, **(extra or {})},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


def _vendor_name(db: Database, vendor_id: ObjectId) -> str:
    vendor = db["vendors"].find_one({"_id": vendor_id}, {"business_name": 1}) or {}
    return str(vendor.get("business_name") or "A service provider")


def request_enrollment(db: Database, vendor_id: ObjectId | str) -> dict[str, Any]:
    """Provider turns the program on: it waits for admin approval."""
    vendor_oid = ObjectId(vendor_id)
    status = _status_of(_enrollment_doc(db, vendor_oid))
    if status in {"pending", "active"}:
        return enrollment(db, vendor_oid)
    now = datetime.now(UTC)
    _set_status(db, vendor_oid, "pending", {"requested_at": now, "rejection_reason": None, "reviewed_at": None})
    name = _vendor_name(db, vendor_oid)
    add_admin_notification(
        db,
        "loyalty_request",
        "Loyalty program request",
        f"{name} wants to join the loyalty program.",
        link="/loyalty",
        metadata={"vendor_id": str(vendor_oid)},
    )
    return enrollment(db, vendor_oid)


def turn_off(db: Database, vendor_id: ObjectId | str, now: datetime | None = None) -> dict[str, Any]:
    """Provider turns the program off, or cancels a pending request.

    Raises ValueError while an active program is inside its minimum period."""
    vendor_oid = ObjectId(vendor_id)
    doc = _enrollment_doc(db, vendor_oid)
    status = _status_of(doc)
    if status == "active":
        active_since = _active_since(doc)
        earliest = active_since + timedelta(days=MIN_ACTIVE_DAYS) if active_since else None
        if earliest and (now or datetime.now(UTC)) < earliest:
            raise ValueError(
                f"The loyalty program must stay on for at least {MIN_ACTIVE_DAYS} days. "
                f"You can turn it off from {earliest.strftime('%d %b %Y')}."
            )
    if status in {"active", "pending"}:
        _set_status(db, vendor_oid, "off", {"turned_off_at": datetime.now(UTC)})
    return enrollment(db, vendor_oid)


def review_request(
    db: Database, vendor_id: ObjectId | str, approve: bool, reason: str | None = None, admin_id: str | None = None
) -> dict[str, Any]:
    """Admin approves or rejects a pending request and the provider is notified."""
    vendor_oid = ObjectId(vendor_id)
    if _status_of(_enrollment_doc(db, vendor_oid)) != "pending":
        raise ValueError("This provider has no pending loyalty request.")
    now = datetime.now(UTC)
    if approve:
        _set_status(db, vendor_oid, "active", {"approved_at": now, "reviewed_at": now, "reviewed_by": admin_id})
        title, message = "Loyalty program approved", (
            f"Your loyalty program is now active. It must stay on for at least {MIN_ACTIVE_DAYS} days."
        )
    else:
        reason = (reason or "").strip() or None
        _set_status(db, vendor_oid, "rejected", {"reviewed_at": now, "reviewed_by": admin_id, "rejection_reason": reason})
        title, message = "Loyalty program request declined", (
            f"Your loyalty program request was declined{': ' + reason if reason else '.'}"
        )
    db[VENDOR_NOTIFICATIONS].insert_one(
        {
            "vendor_id": vendor_oid,
            "type": "loyalty",
            "title": title,
            "message": message,
            "read": False,
            "action_type": "mark_read",
            "action_label": "Mark as Read",
            "metadata": {"link": "/loyalty"},
            "created_at": now,
            "updated_at": now,
        }
    )
    return enrollment(db, vendor_oid)


def list_enrollments(db: Database) -> list[dict[str, Any]]:
    """Every provider that has requested or used the program, pending requests first."""
    docs = list(db[ENROLLMENT_COLLECTION].find({}))
    vendor_ids = [doc["vendor_id"] for doc in docs if isinstance(doc.get("vendor_id"), ObjectId)]
    vendors = {
        row["_id"]: row
        for row in db["vendors"].find({"_id": {"$in": vendor_ids}}, {"business_name": 1, "email": 1, "categories": 1, "category": 1})
    }
    rows = []
    for doc in docs:
        vendor = vendors.get(doc.get("vendor_id"))
        if not vendor:
            continue
        status = _status_of(doc)
        if status == "off" and not doc.get("requested_at"):
            continue
        rows.append(
            {
                "vendor_id": str(vendor["_id"]),
                "business_name": vendor.get("business_name") or "Service provider",
                "email": vendor.get("email"),
                "categories": vendor.get("categories") or ([vendor["category"]] if vendor.get("category") else []),
                **enrollment(db, vendor["_id"]),
            }
        )
    order = {"pending": 0, "active": 1, "rejected": 2, "off": 3}
    rows.sort(key=lambda row: (order[row["status"]], -(datetime.fromisoformat(row["requested_at"]).timestamp() if row["requested_at"] else 0)))
    return rows


# ---------------------------------------------------------------------------
# Points
# ---------------------------------------------------------------------------


def rules_for_vendor(db: Database, vendor_id: ObjectId | str) -> dict[str, Any] | None:
    """The platform rules when the provider's program is active, otherwise None."""
    return get_config(db) if is_active(db, vendor_id) else None


def booking_points(rules: dict[str, Any] | None, total: float, first_booking: bool) -> int:
    if not rules:
        return 0
    total = max(float(total or 0), 0)
    if rules.get("points_rule_type") == "percentage_based":
        points = int(total * float(rules.get("percentage_value") or 0) / 100)
    else:
        unit = float(rules.get("currency_unit") or 0)
        points = int((total / unit) * float(rules.get("points_earned") or 0)) if unit > 0 else 0
    if first_booking:
        points += max(int(rules.get("first_booking_bonus") or 0), 0)
    return max(points, 0)


def points_expiry(rules: dict[str, Any] | None, now: datetime) -> datetime | None:
    policy = str((rules or {}).get("points_expiry_policy") or "1 Year")
    if policy == "No Expiry":
        return None
    years = 2 if policy == "2 Years" else 1
    try:
        return now.replace(year=now.year + years)
    except ValueError:  # 29 February
        return now.replace(month=2, day=28, year=now.year + years)


# ---------------------------------------------------------------------------
# Admin notifications
# ---------------------------------------------------------------------------


def add_admin_notification(
    db: Database, kind: str, title: str, message: str, *, link: str | None = None, metadata: dict[str, Any] | None = None
) -> None:
    now = datetime.now(UTC)
    db[ADMIN_NOTIFICATIONS].insert_one(
        {"type": kind, "title": title, "message": message, "link": link, "metadata": metadata or {}, "read": False, "created_at": now}
    )
