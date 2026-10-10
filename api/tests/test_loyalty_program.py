from datetime import UTC, datetime, timedelta

import mongomock
import pytest
from bson import ObjectId

from app.domain import loyalty
from app.modules.vendor.repositories_portal import VendorPortalRepository


@pytest.fixture
def db():
    database = mongomock.MongoClient()["loyalty_test"]
    database.platform_loyalty_config.insert_one(
        {"_id": "config", "points_rule_type": "points_per_currency", "points_earned": 1, "currency_unit": 10}
    )
    return database


@pytest.fixture
def vendor_id(db):
    return db.vendors.insert_one({"business_name": "Spice Garden", "status": "approved"}).inserted_id


def _complete_booking(db, vendor_id, amount=500):
    customer_id = db.users.insert_one({"full_name": "Guest", "points_balance": 0}).inserted_id
    booking_id = db.vendor_bookings.insert_one(
        {"vendor_id": vendor_id, "customer_id": customer_id, "status": "confirmed", "total_amount": amount}
    ).inserted_id
    return VendorPortalRepository(db).update_booking_status(str(vendor_id), str(booking_id), "complete")


def test_turning_on_waits_for_admin_approval_and_notifies_both_sides(db, vendor_id):
    assert loyalty.request_enrollment(db, vendor_id)["status"] == "pending"
    notification = db.platform_admin_notifications.find_one({})
    assert notification["type"] == "loyalty_request" and "Spice Garden" in notification["message"]
    assert _complete_booking(db, vendor_id)["points_awarded"] == 0  # not active yet

    assert loyalty.review_request(db, vendor_id, approve=True)["status"] == "active"
    assert db.vendor_notifications.find_one({"vendor_id": vendor_id})["title"] == "Loyalty program approved"
    assert _complete_booking(db, vendor_id, amount=500)["points_awarded"] == 50  # 1 point per 10


def test_program_stays_on_for_the_minimum_period(db, vendor_id):
    loyalty.request_enrollment(db, vendor_id)
    loyalty.review_request(db, vendor_id, approve=True)

    with pytest.raises(ValueError, match="at least 30 days"):
        loyalty.turn_off(db, vendor_id)

    later = datetime.now(UTC) + timedelta(days=loyalty.MIN_ACTIVE_DAYS, minutes=1)
    assert loyalty.turn_off(db, vendor_id, now=later)["status"] == "off"


def test_pending_request_can_be_cancelled_and_rejected_requests_can_be_resent(db, vendor_id):
    loyalty.request_enrollment(db, vendor_id)
    assert loyalty.turn_off(db, vendor_id)["status"] == "off"

    loyalty.request_enrollment(db, vendor_id)
    rejected = loyalty.review_request(db, vendor_id, approve=False, reason="Complete your profile first.")
    assert rejected["status"] == "rejected" and rejected["rejection_reason"] == "Complete your profile first."
    assert loyalty.request_enrollment(db, vendor_id)["status"] == "pending"


def test_admin_list_shows_pending_requests_first(db, vendor_id):
    other = db.vendors.insert_one({"business_name": "Lotus Spa"}).inserted_id
    loyalty.request_enrollment(db, other)
    loyalty.review_request(db, other, approve=True)
    loyalty.request_enrollment(db, vendor_id)

    rows = loyalty.list_enrollments(db)
    assert [(row["business_name"], row["status"]) for row in rows] == [("Spice Garden", "pending"), ("Lotus Spa", "active")]


def test_providers_on_the_old_self_service_switch_count_as_active(db):
    legacy_vendor = ObjectId()
    db.vendor_loyalty_settings.insert_one(
        {"vendor_id": legacy_vendor, "enable_loyalty_program": True, "updated_at": datetime.now(UTC)}
    )
    assert loyalty.enrollment(db, legacy_vendor)["status"] == "active"
