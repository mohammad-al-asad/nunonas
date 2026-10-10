from datetime import UTC, datetime

import mongomock
import pytest
from bson import ObjectId

from app.modules.platform_admin import billing


@pytest.fixture
def db():
    database = mongomock.MongoClient()["billing_test"]
    database["platform_admin_settings"].insert_one({"_id": "platform_admin_settings", "commission": {"globalRate": "10"}})
    return database


def _vendor(db, name: str, category: str) -> ObjectId:
    return db["vendors"].insert_one({"business_name": name, "category": category, "vendor_code": name[:2].upper()}).inserted_id


def _booking(db, vendor_id, provider_type, subtotal, *, created, completed, status="complete"):
    db["vendor_bookings"].insert_one(
        {
            "vendor_id": vendor_id,
            "provider_type": provider_type,
            "subtotal": subtotal,
            "total_amount": subtotal,
            "status": status,
            "created_at": created,
            "completed_at": completed,
        }
    )


def _set_rates(db, effective_from, **rules):
    categories = {key: {"model": "percentage", "value": 10} for key in billing.CATEGORIES}
    categories.update(rules)
    db[billing.RATE_HISTORY].insert_one({"effective_from": effective_from, "categories": categories})


def test_only_completed_bookings_are_billed_on_subtotal(db):
    hotel = _vendor(db, "Grand Hotel", "Hotel")
    _booking(db, hotel, "hotel", 1000, created=datetime(2026, 3, 1, tzinfo=UTC), completed=datetime(2026, 3, 5, tzinfo=UTC))
    _booking(db, hotel, "hotel", 5000, created=datetime(2026, 3, 2, tzinfo=UTC), completed=None, status="confirmed")
    _booking(db, hotel, "hotel", 7000, created=datetime(2026, 3, 3, tzinfo=UTC), completed=None, status="canceled")

    [invoice] = billing.build_invoices(db, period="2026-03")

    assert invoice["bookings"] == 1
    assert invoice["bookingValue"] == 1000
    assert invoice["amountDue"] == 100  # legacy global rate (10%) is the initial version


def test_rate_at_booking_time_and_per_lead(db):
    billing.ensure_rate_history(db)  # initial: 10% everywhere
    _set_rates(db, datetime(2026, 3, 15, tzinfo=UTC), restaurant={"model": "per_lead", "value": 50}, hotel={"model": "percentage", "value": 20})
    cafe = _vendor(db, "Cafe Uno", "Restaurant")
    # Booked before the change -> 10%; completed in March.
    _booking(db, cafe, "restaurant", 400, created=datetime(2026, 3, 10, tzinfo=UTC), completed=datetime(2026, 3, 20, tzinfo=UTC))
    # Booked after the change -> $50 per lead, regardless of value.
    _booking(db, cafe, "restaurant", 900, created=datetime(2026, 3, 16, tzinfo=UTC), completed=datetime(2026, 3, 21, tzinfo=UTC))
    _booking(db, cafe, "restaurant", 100, created=datetime(2026, 3, 17, tzinfo=UTC), completed=datetime(2026, 3, 22, tzinfo=UTC))

    [invoice] = billing.build_invoices(db, period="2026-03")

    lines = {(line["model"], line["rate"]): line for line in invoice["lines"]}
    assert lines[("percentage", 10)]["commission"] == 40
    assert lines[("per_lead", 50)]["bookings"] == 2
    assert lines[("per_lead", 50)]["commission"] == 100
    assert invoice["amountDue"] == 140


def test_invoices_are_monthly_by_completion_date(db):
    spa = _vendor(db, "Lotus Spa", "Spa")
    _booking(db, spa, "spa", 300, created=datetime(2026, 1, 30, tzinfo=UTC), completed=datetime(2026, 2, 2, tzinfo=UTC))
    _booking(db, spa, "spa", 200, created=datetime(2026, 1, 10, tzinfo=UTC), completed=datetime(2026, 1, 12, tzinfo=UTC))

    invoices = billing.build_invoices(db, vendor_id=spa)

    assert [(inv["period"], inv["amountDue"]) for inv in invoices] == [("2026-02", 30), ("2026-01", 20)]


def test_mark_paid_freezes_and_unpaid_recalculates(db):
    spa = _vendor(db, "Lotus Spa", "Spa")
    _booking(db, spa, "spa", 300, created=datetime(2026, 2, 1, tzinfo=UTC), completed=datetime(2026, 2, 2, tzinfo=UTC))

    paid = billing.set_invoice_status(db, spa, "2026-02", "PAID", "admin")
    assert paid["status"] == "PAID" and paid["paidAt"]
    assert billing.overview(db, "2026-02")["summary"]["collected"] == 30

    # A late booking edit doesn't change a paid invoice...
    db["vendor_bookings"].update_many({}, {"$set": {"subtotal": 1000}})
    assert billing.build_invoices(db, period="2026-02")[0]["amountDue"] == 30

    # ...but undoing the payment recalculates from the bookings.
    unpaid = billing.set_invoice_status(db, spa, "2026-02", "UNPAID", "admin")
    assert unpaid["status"] == "UNPAID" and unpaid["paidAt"] is None
    assert unpaid["amountDue"] == 100
    assert billing.overview(db, "2026-02")["summary"]["outstanding"] == 100


def test_save_rates_versions_only_on_change_and_validates(db):
    billing.ensure_rate_history(db)
    rules = {key: {"model": "percentage", "value": 10} for key in billing.CATEGORIES}
    billing.save_rates(db, rules)
    assert db[billing.RATE_HISTORY].count_documents({}) == 1

    billing.save_rates(db, {**rules, "event": {"model": "per_lead", "value": 25}})
    assert db[billing.RATE_HISTORY].count_documents({}) == 2
    assert billing.current_rates(db)["event"] == {"model": "per_lead", "value": 25}

    with pytest.raises(ValueError):
        billing.save_rates(db, {**rules, "spa": {"model": "percentage", "value": 150}})
