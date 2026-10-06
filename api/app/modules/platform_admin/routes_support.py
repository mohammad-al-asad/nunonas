import re
from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pymongo.database import Database

from app.domain import support_tickets
from app.modules.platform_admin.deps import get_platform_admin_db
from app.modules.platform_admin.deps_auth import get_current_platform_admin

router = APIRouter(
    prefix="/platform-admin/support/tickets",
    tags=["Platform Admin - Support (Live)"],
    dependencies=[Depends(get_current_platform_admin)],
)


def _resolve_ticket_query(ticket_id: str) -> dict:
    try:
        return {"_id": ObjectId(ticket_id)}
    except (InvalidId, TypeError):
        return {"ticket_code": ticket_id}


def _serialize_ticket(document: dict | None) -> dict | None:
    if not document:
        return None
    messages = document.get("messages") if isinstance(document.get("messages"), list) else []
    requester_type = document.get("requester_type") or ("vendor" if document.get("vendor_id") else "user")
    requester_id = document.get("vendor_id") if requester_type == "vendor" else document.get("user_id")
    return {
        "id": str(document.get("ticket_code") or document.get("_id") or ""),
        "ticket_key": str(document.get("_id") or ""),
        "ticket_code": str(document.get("ticket_code") or ""),
        "requester_type": requester_type,
        "requester_id": str(requester_id or ""),
        "user_name": str(document.get("requester_name") or "Unknown"),
        "user_email": str(document.get("requester_email") or ""),
        "user_role": "Provider" if requester_type == "vendor" else "User",
        "avatar": str(document.get("requester_avatar") or ""),
        "type": support_tickets.title_case(document.get("issue_type"), "Technical"),
        "subject": str(document.get("subject") or ""),
        "status": support_tickets.title_case(document.get("status"), "Open"),
        "priority": support_tickets.title_case(document.get("priority"), "Medium"),
        "opened_at": support_tickets.iso(document.get("created_at")),
        "issue_details": str(document.get("description") or ""),
        "conversation": [support_tickets.serialize_message(item) for item in messages],
        "updated_at": support_tickets.iso(document.get("updated_at")),
    }


def _status_or_400(raw_status: str) -> str:
    normalized = support_tickets.normalize_status(raw_status)
    if not normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status.")
    return normalized


def _find_or_404(db: Database, ticket_id: str) -> dict:
    ticket = db[support_tickets.COLLECTION].find_one(_resolve_ticket_query(ticket_id))
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found.")
    return ticket


@router.get("")
def list_support_tickets(
    limit: int = Query(default=100, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    priority_filter: str | None = Query(default=None, alias="priority"),
    requester_filter: str | None = Query(default=None, alias="requester", description="user or vendor"),
    db: Database = Depends(get_platform_admin_db),
) -> dict:
    collection = db[support_tickets.COLLECTION]
    query: dict = {}
    if search:
        pattern = {"$regex": re.escape(search), "$options": "i"}
        query["$or"] = [{"ticket_code": pattern}, {"requester_name": pattern}, {"subject": pattern}]
    if status_filter:
        query["status"] = _status_or_400(status_filter)
    if priority_filter:
        query["priority"] = str(priority_filter).strip().lower()
    if requester_filter:
        if requester_filter not in support_tickets.REQUESTER_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requester must be user or vendor.")
        query["requester_type"] = requester_filter

    rows = list(collection.find(query).sort("updated_at", -1).skip(skip).limit(limit))
    counts = {row["_id"]: row["count"] for row in collection.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}])}
    return {
        "counts": {
            "total": sum(counts.values()),
            "open": counts.get("open", 0),
            "in_progress": counts.get("in_progress", 0),
            "resolved": counts.get("resolved", 0),
        },
        "tickets": [_serialize_ticket(row) for row in rows],
        "total": int(collection.count_documents(query)),
    }


@router.get("/{ticket_id}")
def get_support_ticket(ticket_id: str, db: Database = Depends(get_platform_admin_db)) -> dict:
    return _serialize_ticket(_find_or_404(db, ticket_id)) or {}


@router.post("/{ticket_id}/messages")
def reply_support_ticket(
    ticket_id: str,
    payload: dict = Body(...),
    db: Database = Depends(get_platform_admin_db),
) -> dict:
    message = str(payload.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required.")
    ticket = _find_or_404(db, ticket_id)

    now = datetime.now(UTC)
    update: dict = {
        "$push": {"messages": support_tickets.new_message("agent", str(payload.get("name") or "Support Agent"), message, now)},
        "$set": {"updated_at": now},
    }
    if ticket.get("status") == "open":
        update["$set"]["status"] = "in_progress"
    db[support_tickets.COLLECTION].update_one({"_id": ticket["_id"]}, update)
    return _serialize_ticket(db[support_tickets.COLLECTION].find_one({"_id": ticket["_id"]})) or {}


@router.patch("/{ticket_id}/status")
def update_support_ticket_status(
    ticket_id: str,
    payload: dict = Body(...),
    db: Database = Depends(get_platform_admin_db),
) -> dict:
    next_status = _status_or_400(str(payload.get("status") or ""))
    ticket = _find_or_404(db, ticket_id)

    now = datetime.now(UTC)
    note = f'Ticket status updated to "{support_tickets.title_case(next_status, "Open")}".'
    db[support_tickets.COLLECTION].update_one(
        {"_id": ticket["_id"]},
        {
            "$set": {"status": next_status, "updated_at": now},
            "$push": {"messages": support_tickets.new_message("agent", "System", note, now)},
        },
    )
    return _serialize_ticket(db[support_tickets.COLLECTION].find_one({"_id": ticket["_id"]})) or {}
