import base64
from datetime import UTC, datetime, timedelta

import mongomock
from bson import ObjectId

from app.db.vendor_indexes import ensure_vendor_indexes
from app.modules.vendor.repositories_password_reset import VendorPasswordResetRepository
from app.modules.vendor.repositories_portal import VendorPortalRepository
from app.modules.vendor.repositories_signup import VendorSignupVerificationRepository
from app.modules.vendor.repositories_vendor import VendorRepository


class _NoIndexCollection:
    def create_index(self, *args, **kwargs):  # pragma: no cover - failure path
        raise AssertionError("repositories must not create indexes during requests")

    def create_indexes(self, *args, **kwargs):  # pragma: no cover - failure path
        raise AssertionError("repositories must not create indexes during requests")

    def drop_index(self, *args, **kwargs):  # pragma: no cover - failure path
        raise AssertionError("repositories must not mutate indexes during requests")


class _NoIndexDatabase:
    def __getitem__(self, name):
        return _NoIndexCollection()


def test_vendor_repository_constructors_do_not_touch_indexes():
    database = _NoIndexDatabase()
    VendorRepository(database)
    VendorPortalRepository(database)
    VendorSignupVerificationRepository(database)
    VendorPasswordResetRepository(database)


def test_vendor_index_migration_is_idempotent():
    database = mongomock.MongoClient().nuno
    first = ensure_vendor_indexes(database)
    second = ensure_vendor_indexes(database)

    assert first == second
    assert "vendor_booking_schedule" in second["vendor_bookings"]


def test_occupancy_only_counts_bookings_for_requested_date():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    repository = VendorPortalRepository(database)
    today = datetime.now(UTC).date().isoformat()
    yesterday = (datetime.now(UTC).date() - timedelta(days=1)).isoformat()
    database.vendor_rooms.insert_one({"vendor_id": vendor_id, "total_inventory": 10})
    database.vendor_bookings.insert_many(
        [
            {"vendor_id": vendor_id, "scheduled_date": today, "status": "confirmed"},
            {"vendor_id": vendor_id, "scheduled_date": yesterday, "status": "confirmed"},
        ]
    )

    metrics = repository.get_occupancy_metrics(str(vendor_id), today)

    assert metrics["active_bookings"] == 1
    assert metrics["rooms_total"] == 10
    assert metrics["occupancy_rate"] == 10.0


def test_completed_vendor_booking_cannot_be_rescheduled():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    booking_id = database.vendor_bookings.insert_one(
        {
            "vendor_id": vendor_id,
            "status": "complete",
            "scheduled_date": "2026-07-26",
            "scheduled_time": "18:00",
        }
    ).inserted_id
    repository = VendorPortalRepository(database)

    try:
        repository.reschedule_booking(
            str(vendor_id),
            str(booking_id),
            "2026-07-27",
            "19:00",
        )
    except ValueError as exc:
        assert str(exc) == "Only active bookings can be rescheduled."
    else:
        raise AssertionError("Completed booking was rescheduled")

    booking = database.vendor_bookings.find_one({"_id": booking_id})
    assert booking["scheduled_date"] == "2026-07-26"
    assert booking["scheduled_time"] == "18:00"


def test_dashboard_booking_trends_and_month_count_use_booking_request_time():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    repository = VendorPortalRepository(database)
    now = datetime.now(UTC)
    current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month = repository._month_offset(current_month, 1)
    previous_month = repository._month_offset(current_month, -1)
    same_month_last_year = current_month.replace(year=current_month.year - 1)

    database.vendor_bookings.insert_many(
        [
            {
                "vendor_id": vendor_id,
                "requested_at": now,
                "created_at": now,
                "scheduled_date": (next_month + timedelta(days=4)).date().isoformat(),
                "provider_type": "restaurant",
                "status": "pending",
            },
            {
                "vendor_id": vendor_id,
                "created_at": now,
                "scheduled_date": now,
                "provider_type": "hotel",
                "status": "complete",
                "total_amount": 100,
            },
            {
                "vendor_id": vendor_id,
                "scheduled_date": now.date().isoformat(),
                "provider_type": "spa",
                "status": "pending",
            },
            {
                "vendor_id": vendor_id,
                "created_at": previous_month + timedelta(days=2),
                "provider_type": "event",
                "status": "pending",
            },
            {
                "vendor_id": vendor_id,
                "created_at": same_month_last_year + timedelta(days=2),
                "scheduled_date": now.date().isoformat(),
                "provider_type": "restaurant",
                "status": "pending",
            },
        ]
    )

    overview = repository.get_dashboard_overview(str(vendor_id))
    trends = overview["booking_trends"]
    current_period = current_month.strftime("%Y-%m")
    previous_period = previous_month.strftime("%Y-%m")
    trend_counts = {point["period"]: point["bookings"] for point in trends}

    assert len(trends) == 12
    assert len({point["period"] for point in trends}) == 12
    assert len({point["month"] for point in trends}) == 12
    assert trends[-1]["period"] == current_period
    assert trend_counts[current_period] == 3
    assert trend_counts[previous_period] == 1
    assert overview["kpis"]["total_bookings_month"] == 3
    assert overview["kpis"]["todays_bookings"] == 2
    assert overview["kpis"]["monthly_revenue"] == 100
    assert len(overview["booking_rows"]) == 3


def test_vendor_legal_edits_do_not_modify_platform_legal_content():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    repository = VendorPortalRepository(database)
    database.platform_admin_settings.insert_one(
        {
            "_id": "platform_admin_settings",
            "legalContent": {
                "documents": {"terms": "Terms of Service"},
                "content": {"terms": {"business": "Platform terms"}},
                "lastUpdated": "Platform date",
            },
        }
    )

    updated = repository.update_legal_doc(str(vendor_id), "terms", "Vendor terms", "business")

    platform = database.platform_admin_settings.find_one({"_id": "platform_admin_settings"})
    vendor_settings = database.vendor_portal_settings.find_one({"vendor_id": vendor_id})
    assert platform["legalContent"]["content"]["terms"]["business"] == "Platform terms"
    assert vendor_settings["legal_content"]["content"]["terms"]["business"] == "Vendor terms"
    assert repository.get_public_legal_doc("terms")["content"] == "Platform terms"
    assert updated["content"] == "Vendor terms"


def test_vendor_commission_is_read_from_category_rates():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    repository = VendorPortalRepository(database)
    database.vendors.insert_one({"_id": vendor_id, "category": "Spa"})
    database.commission_rate_history.insert_one(
        {
            "effective_from": datetime(2026, 1, 1, tzinfo=UTC),
            "categories": {
                "restaurant": {"model": "percentage", "value": 10},
                "hotel": {"model": "percentage", "value": 15},
                "spa": {"model": "per_lead", "value": 40},
                "event": {"model": "percentage", "value": 8},
            },
        }
    )

    commission = repository.get_settings_commission(str(vendor_id))

    assert commission["category"] == "Spa"
    assert commission["model"] == "per_lead"
    assert commission["per_lead_fee"] == 40
    assert commission["commission_percent"] is None
    assert commission["source"] == "platform_admin_billing"


def test_generated_receipt_is_a_downloadable_pdf_with_a_safe_filename():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    booking_id = ObjectId()
    repository = VendorPortalRepository(database)
    database.vendor_bookings.insert_one(
        {
            "_id": booking_id,
            "vendor_id": vendor_id,
            "booking_code": "../../unsafe code",
            "customer_name": "<script>alert(1)</script>",
            "service": "Dinner & stay",
            "total_amount": 100,
        }
    )

    receipt = repository.generate_receipt(str(vendor_id), str(booking_id))

    assert receipt is not None
    assert receipt["content_type"] == "application/pdf"
    assert receipt["filename"].startswith("receipt-")
    assert receipt["filename"].endswith(".pdf")
    assert "/" not in receipt["filename"]
    assert base64.b64decode(receipt["content_base64"]).startswith(b"%PDF")


def test_receipt_shows_discount_and_matches_the_booking_total():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    booking_id = database.vendor_bookings.insert_one(
        {
            "vendor_id": vendor_id,
            "booking_code": "#BK-1",
            "customer_name": "Guest",
            "service": "Table Booking",
            "original_subtotal": 1000,
            "discount_amount": 100,
            "subtotal": 900,
            "total_amount": 900,
            "payment_status": "paid",
        }
    ).inserted_id

    receipt = VendorPortalRepository(database).generate_receipt(str(vendor_id), str(booking_id))

    assert receipt["total"] == 900
    assert [item["label"] for item in receipt["line_items"]] == ["Discount"]
    assert base64.b64decode(receipt["content_base64"]).startswith(b"%PDF")


def test_manual_booking_takes_capacity_but_is_not_billed_or_mirrored():
    from app.modules.customer.repositories_customer import CustomerRepository
    from app.modules.platform_admin import billing

    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    database.vendors.insert_one({"_id": vendor_id, "status": "approved", "business_name": "Walk-in Bistro"})
    database.vendor_portal_settings.insert_one(
        {"vendor_id": vendor_id, "profile": {"restaurant_settings": {"available_booking_times": ["07:00 PM"], "booking_capacity": 1}}}
    )
    repository = VendorPortalRepository(database)

    booking = repository.create_manual_booking(
        str(vendor_id),
        {"provider_type": "restaurant", "customer_name": "Phone Guest", "customer_phone": "01700000000",
         "date": "2026-07-31", "time": "07:00 PM", "guests": 3, "total_amount": 1500},
    )
    assert booking["source"] == "manual" and booking["status"] == "confirmed"
    assert booking["booking_code"].startswith("#MB")
    assert database.bookings.count_documents({}) == 0  # platform-wide booking stats stay app-only

    # It occupies the slot for app customers.
    slots = CustomerRepository(database).get_booking_availability(str(vendor_id), "2026-07-31")["slots"]
    assert slots[0]["available"] is False

    repository.update_booking_status(str(vendor_id), booking["id"], "complete")
    assert billing._billable_bookings(database, [vendor_id]) == []


def _pdf_text(pdf: bytes) -> str:
    import re
    import zlib

    chunks = []
    for stream in re.findall(rb"stream\r?\n(.*?)\r?\nendstream", pdf, re.S):
        try:
            chunks.append(zlib.decompress(stream).decode("latin-1"))
        except zlib.error:
            continue
    return "".join(chunks)


def test_hotel_receipt_shows_room_and_stay_dates():
    database = mongomock.MongoClient().nuno
    vendor_id = ObjectId()
    booking_id = database.vendor_bookings.insert_one(
        {
            "vendor_id": vendor_id,
            "booking_code": "#BK-STAY",
            "customer_name": "Hotel Guest",
            "service": "Room Booking",
            "provider_type": "hotel",
            "room_type": "Deluxe King",
            "check_in_date": "2026-10-10",
            "check_out_date": "2026-10-12",
            "nights": 2,
            "rate_per_night": 6500,
            "scheduled_date": "2026-10-10",
            "subtotal": 13000,
            "total_amount": 13000,
        }
    ).inserted_id

    receipt = VendorPortalRepository(database).generate_receipt(str(vendor_id), str(booking_id))
    text = _pdf_text(base64.b64decode(receipt["content_base64"]))

    for expected in ("Deluxe King", "Check-in", "2026-10-10", "Check-out", "2026-10-12", "Rate per night", "$6,500.00"):
        assert expected in text, expected
    assert "Time" not in text
