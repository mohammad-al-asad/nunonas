"""One support-ticket model for app users and service providers.

Every ticket lives in ``support_tickets``. ``requester_type`` says who opened it
("user" from the mobile app, "vendor" from the service-provider portal) and the
matching ``user_id`` / ``vendor_id`` links it to that account. Messages share
one shape: ``{sender_role: user|vendor|agent, sender_name, text, created_at}``.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.database import Database

COLLECTION = "support_tickets"
LEGACY_VENDOR_COLLECTION = "vendor_support_tickets"

REQUESTER_TYPES = {"user", "vendor"}
ISSUE_TYPES = {"account", "technical", "billing", "compliance"}
PRIORITIES = {"low", "medium", "high"}
STATUSES = {"open", "in_progress", "resolved"}

INDEXES = [
    IndexModel([("ticket_code", ASCENDING)], unique=True),
    IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
    IndexModel([("vendor_id", ASCENDING), ("created_at", DESCENDING)]),
    IndexModel([("status", ASCENDING), ("updated_at", DESCENDING)]),
]


def new_ticket_code(now: datetime | None = None) -> str:
    stamp = (now or datetime.now(UTC)).strftime("%Y%m%d")
    return f"SUP-{stamp}-{str(ObjectId())[-6:].upper()}"


def title_case(value: Any, fallback: str) -> str:
    normalized = str(value or "").strip().replace("_", " ").lower()
    return " ".join(part.capitalize() for part in normalized.split()) if normalized else fallback


def normalize_status(value: Any) -> str | None:
    normalized = str(value or "").strip().lower().replace(" ", "_")
    return normalized if normalized in STATUSES else None


def new_message(sender_role: str, sender_name: str, text: str, now: datetime | None = None) -> dict:
    return {"sender_role": sender_role, "sender_name": sender_name, "text": text, "created_at": now or datetime.now(UTC)}


def new_ticket(
    *,
    requester_type: str,
    requester_id: ObjectId,
    requester_name: str,
    requester_email: str = "",
    requester_avatar: str = "",
    subject: str,
    description: str,
    issue_type: str = "technical",
    priority: str = "medium",
    now: datetime | None = None,
) -> dict:
    if requester_type not in REQUESTER_TYPES:
        raise ValueError(f"Unknown requester type: {requester_type}")
    now = now or datetime.now(UTC)
    return {
        "ticket_code": new_ticket_code(now),
        "requester_type": requester_type,
        "user_id" if requester_type == "user" else "vendor_id": requester_id,
        "requester_name": requester_name,
        "requester_email": requester_email,
        "requester_avatar": requester_avatar,
        "issue_type": issue_type if issue_type in ISSUE_TYPES else "technical",
        "subject": subject,
        "description": description,
        "status": "open",
        "priority": priority if priority in PRIORITIES else "medium",
        "messages": [new_message(requester_type, requester_name, description, now)],
        "created_at": now,
        "updated_at": now,
    }


def iso(value: Any) -> str | None:
    return value.isoformat() if isinstance(value, datetime) else None


def serialize_message(message: dict) -> dict:
    role = str(message.get("sender_role") or "").lower()
    return {
        "sender": "agent" if role == "agent" else "user",
        "sender_role": role or "user",
        "text": str(message.get("text") or ""),
        "time": iso(message.get("created_at")),
        "name": str(message.get("sender_name") or ""),
    }


def ensure_indexes(db: Database) -> None:
    db[COLLECTION].create_indexes(INDEXES)


def migrate_legacy_vendor_tickets(db: Database) -> int:
    """Move tickets from the old ``vendor_support_tickets`` collection, then drop it."""
    if LEGACY_VENDOR_COLLECTION not in db.list_collection_names():
        return 0
    moved = 0
    vendors = db["vendors"]
    for old in db[LEGACY_VENDOR_COLLECTION].find({}):
        vendor = vendors.find_one({"_id": old.get("vendor_id")}, {"business_name": 1, "owner_full_name": 1, "email": 1, "logo_url": 1}) or {}
        name = str(vendor.get("business_name") or vendor.get("owner_full_name") or "Service provider")
        created = old.get("created_at") or datetime.now(UTC)
        messages = [new_message("vendor", name, str(old.get("description") or ""), created)]
        for item in old.get("messages") or []:
            sender = str(item.get("sender") or "vendor").lower()
            messages.append(
                new_message(
                    "agent" if sender in {"agent", "admin", "support"} else "vendor",
                    "Support Agent" if sender in {"agent", "admin", "support"} else name,
                    str(item.get("message") or item.get("text") or ""),
                    item.get("sent_at") or item.get("created_at") or created,
                )
            )
        db[COLLECTION].insert_one(
            {
                "ticket_code": new_ticket_code(created),
                "legacy_ticket_code": old.get("ticket_code"),
                "requester_type": "vendor",
                "vendor_id": old.get("vendor_id"),
                "requester_name": name,
                "requester_email": str(vendor.get("email") or ""),
                "requester_avatar": str(vendor.get("logo_url") or ""),
                "issue_type": "technical",
                "subject": str(old.get("subject") or ""),
                "description": str(old.get("description") or ""),
                "status": normalize_status(old.get("status")) or "open",
                "priority": "medium",
                "messages": messages,
                "created_at": created,
                "updated_at": old.get("updated_at") or created,
            }
        )
        moved += 1
    db.drop_collection(LEGACY_VENDOR_COLLECTION)
    return moved


def backfill_user_tickets(db: Database) -> int:
    """Give tickets created before the merge (mobile app only) the shared requester fields."""
    updated = 0
    for doc in db[COLLECTION].find({"requester_type": {"$exists": False}}):
        updated += db[COLLECTION].update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "requester_type": "vendor" if doc.get("vendor_id") else "user",
                    "requester_name": doc.get("user_name") or "Customer",
                    "requester_email": doc.get("user_email") or "",
                    "requester_avatar": doc.get("user_avatar") or "",
                },
                "$unset": {"user_name": "", "user_email": "", "user_avatar": ""},
            },
        ).modified_count
    return updated
