from datetime import UTC, datetime

import mongomock
import pytest
from bson import ObjectId

from app.domain import support_tickets
from app.modules.platform_admin import routes_support
from app.modules.vendor.repositories_portal import VendorPortalRepository


@pytest.fixture
def db():
    return mongomock.MongoClient()["support_test"]


def _admin_list(db, **filters):
    params = {"limit": 100, "skip": 0, "search": None, "status_filter": None, "priority_filter": None, "requester_filter": None}
    params.update(filters)
    return routes_support.list_support_tickets(db=db, **params)


def test_provider_ticket_round_trip_through_admin(db):
    vendor_id = db["vendors"].insert_one({"business_name": "Lotus Spa", "email": "lotus@test"}).inserted_id
    repo = VendorPortalRepository(db)

    created = repo.create_support_ticket(str(vendor_id), "Payout question", "When is my commission invoice due?")
    assert created["status"] == "Open" and created["messages"] == []  # opening message is the description

    listed = _admin_list(db, requester_filter="vendor")
    [ticket] = listed["tickets"]
    assert ticket["user_role"] == "Provider"
    assert ticket["user_name"] == "Lotus Spa"
    assert ticket["conversation"][0]["text"] == "When is my commission invoice due?"
    assert listed["counts"] == {"total": 1, "open": 1, "in_progress": 0, "resolved": 0}

    routes_support.reply_support_ticket(ticket["ticket_code"], {"message": "By the 15th."}, db=db)
    routes_support.update_support_ticket_status(ticket["ticket_code"], {"status": "Resolved"}, db=db)

    seen = repo.get_support_ticket(str(vendor_id), created["id"])
    assert seen["status"] == "Resolved"
    assert [(m["sender"], m["message"]) for m in seen["messages"]][0] == ("Support", "By the 15th.")

    # Writing again re-opens the ticket for the support team.
    replied = repo.add_support_ticket_message(str(vendor_id), created["id"], "Thanks, one more thing")
    assert replied["status"] == "In Progress"
    assert replied["messages"][-1] == {
        "sender": "You",
        "sender_role": "vendor",
        "message": "Thanks, one more thing",
        "sent_at": replied["messages"][-1]["sent_at"],
    }


def test_users_and_providers_share_one_list_but_stay_private(db):
    vendor_a = db["vendors"].insert_one({"business_name": "A"}).inserted_id
    vendor_b = db["vendors"].insert_one({"business_name": "B"}).inserted_id
    repo = VendorPortalRepository(db)
    ticket_a = repo.create_support_ticket(str(vendor_a), "Subject A", "Provider A needs help")
    db[support_tickets.COLLECTION].insert_one(
        support_tickets.new_ticket(
            requester_type="user", requester_id=ObjectId(), requester_name="Customer",
            subject="App issue", description="The map does not load",
        )
    )

    assert {t["user_role"] for t in _admin_list(db)["tickets"]} == {"User", "Provider"}
    assert [t["user_role"] for t in _admin_list(db, requester_filter="user")["tickets"]] == ["User"]
    assert repo.list_support_tickets(str(vendor_b), limit=10, skip=0)["total"] == 0
    assert repo.get_support_ticket(str(vendor_b), ticket_a["id"]) is None


def test_legacy_vendor_tickets_are_migrated_and_dropped(db):
    vendor_id = db["vendors"].insert_one({"business_name": "Spice Garden", "email": "spice@test"}).inserted_id
    db["vendor_support_tickets"].insert_one(
        {
            "vendor_id": vendor_id,
            "ticket_code": "#SP-2026-abc",
            "subject": "Old ticket",
            "description": "Created before the merge",
            "status": "open",
            "messages": [{"sender": "vendor", "message": "Any update?", "sent_at": datetime(2026, 1, 2, tzinfo=UTC)}],
            "created_at": datetime(2026, 1, 1, tzinfo=UTC),
        }
    )

    assert support_tickets.migrate_legacy_vendor_tickets(db) == 1
    assert "vendor_support_tickets" not in db.list_collection_names()

    moved = db[support_tickets.COLLECTION].find_one({"legacy_ticket_code": "#SP-2026-abc"})
    assert moved["requester_type"] == "vendor" and moved["requester_name"] == "Spice Garden"
    assert [m["text"] for m in moved["messages"]] == ["Created before the merge", "Any update?"]
    assert support_tickets.migrate_legacy_vendor_tickets(db) == 0  # idempotent
