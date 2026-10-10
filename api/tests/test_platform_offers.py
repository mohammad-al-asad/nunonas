from datetime import UTC, datetime, timedelta

import mongomock
import pytest
from bson import ObjectId

from app.domain import platform_offers, promotion_types
from app.modules.customer.repositories_customer import CustomerRepository
from app.modules.platform_admin import billing


def _day(offset: int = 0) -> str:
    return (datetime.now(UTC).date() + timedelta(days=offset)).isoformat()


def _setup():
    db = mongomock.MongoClient().nuno
    platform_offers.ensure_indexes(db)
    vendor_id = db.vendors.insert_one(
        {"status": "approved", "business_name": "Spice Garden", "email": "spice@example.com", "categories": ["Restaurant"]}
    ).inserted_id
    other_id = db.vendors.insert_one({"status": "approved", "business_name": "Lotus Spa", "categories": ["Spa"]}).inserted_id
    db.vendors.insert_one({"status": "pending", "business_name": "Not approved yet"})
    customer_id = db.users.insert_one({"full_name": "Guest"}).inserted_id
    db.vendor_rooms.insert_one({"vendor_id": vendor_id, "available": True, "base_price": 100})
    db.vendor_portal_settings.insert_one({"vendor_id": vendor_id, "general": {"booking_availability_slots": ["10:00 AM"]}})
    return db, vendor_id, other_id, customer_id


def _offer(db, **overrides):
    payload = {
        "name": "Summer 50% Off",
        "purpose": "Bring guests in during the summer.",
        "discount_type": "percentage",
        "discount_value": 50,
        "start_date": _day(0),
        "end_date": _day(30),
        **overrides,
    }
    offer, vendors = platform_offers.create_offer(db, payload, admin_id="admin")
    return offer, vendors


def _quote(db, vendor_id, customer_id, day=None):
    return CustomerRepository(db).get_booking_quote(
        str(vendor_id), "restaurant", 2, day or _day(1), "10:00 AM", None, str(customer_id)
    )


def test_creating_an_offer_notifies_every_approved_provider():
    db, vendor_id, other_id, _ = _setup()

    offer, vendors = _offer(db)

    assert offer["state"] == "live"
    assert {vendor["_id"] for vendor in vendors} == {vendor_id, other_id}
    notified = {row["vendor_id"] for row in db.vendor_notifications.find({"type": "platform_offer"})}
    assert notified == {vendor_id, other_id}


@pytest.mark.parametrize(
    "overrides",
    [
        {"discount_value": 120},
        {"discount_type": "bogo"},
        {"end_date": _day(-1), "start_date": _day(-5)},
        {"start_date": _day(5), "end_date": _day(2)},
        {"purpose": ""},
    ],
)
def test_invalid_offers_are_rejected(overrides):
    db, *_ = _setup()
    with pytest.raises(ValueError):
        _offer(db, **overrides)


def test_provider_answers_once_and_offer_waits_until_then():
    db, vendor_id, _, _ = _setup()
    offer, _ = _offer(db)

    [row] = platform_offers.list_for_vendor(db, str(vendor_id))
    assert row["response"] == "pending" and row["can_respond"] is True

    answered = platform_offers.respond(db, str(vendor_id), offer["id"], accept=True)
    assert answered["response"] == "accepted" and answered["can_respond"] is False
    with pytest.raises(ValueError):
        platform_offers.respond(db, str(vendor_id), offer["id"], accept=False)

    [summary] = platform_offers.list_for_admin(db)
    assert (summary["accepted"], summary["rejected"], summary["pending"]) == (1, 0, 1)


def test_accepted_offer_discounts_bookings_and_commission_uses_the_discounted_price():
    db, vendor_id, _, customer_id = _setup()
    offer, _ = _offer(db)
    db.vendor_promotions.insert_one(
        {"vendor_id": vendor_id, "promotion_name": "20% off", "offer_type": "percentage", "discount_value": 20, "active": True}
    )

    assert _quote(db, vendor_id, customer_id)["discount_amount"] == 40  # own promotion only, not joined yet

    platform_offers.respond(db, str(vendor_id), offer["id"], accept=True)
    quote = _quote(db, vendor_id, customer_id)
    assert quote["original_subtotal"] == 200
    assert quote["discount_amount"] == 100  # the best single discount wins
    assert quote["total"] == 100
    assert quote["promotion_name"] == "Summer 50% Off"
    assert quote["platform_offer_id"] == offer["id"]

    booking = CustomerRepository(db).create_booking(
        str(customer_id), str(vendor_id), "restaurant", _day(1), "10:00 AM", 2, None, None, False
    )
    stored = db.vendor_bookings.find_one({"_id": ObjectId(booking["id"])})
    assert stored["platform_offer_id"] == ObjectId(offer["id"])
    assert billing._booking_value(stored) == 100  # commission is on what the customer pays

    # Outside the offer period the platform offer no longer applies.
    assert _quote(db, vendor_id, customer_id, day=_day(40))["discount_amount"] == 40


def test_rejected_offer_never_applies():
    db, vendor_id, _, customer_id = _setup()
    offer, _ = _offer(db)
    platform_offers.respond(db, str(vendor_id), offer["id"], accept=False)

    assert _quote(db, vendor_id, customer_id)["discount_amount"] == 0
    assert CustomerRepository(db)._home_platform_offers() == []


def test_joined_offer_shows_on_home_and_on_the_provider_page():
    db, vendor_id, _, _ = _setup()
    offer, _ = _offer(db)
    platform_offers.respond(db, str(vendor_id), offer["id"], accept=True)
    repo = CustomerRepository(db)

    [home] = repo._home_platform_offers()
    assert home["id"] == offer["id"]
    assert [(p["id"], p["service_type"]) for p in home["providers"]] == [(str(vendor_id), "restaurant")]

    [shown] = repo._list_service_offers(vendor_id, "restaurant")
    assert shown["source"] == "platform" and shown["label"] == "50% off"


def test_in_venue_offers_are_shown_but_do_not_change_the_booking_price():
    db, vendor_id, _, customer_id = _setup()
    db.vendor_promotions.insert_one(
        {
            "vendor_id": vendor_id,
            "promotion_name": "Two-for-one mains",
            "offer_type": "bogo",
            "terms": "Buy any main course, get a second free.",
            "applicable_to": "Dining Only",
            "active": True,
        }
    )

    assert _quote(db, vendor_id, customer_id)["discount_amount"] == 0
    [shown] = CustomerRepository(db)._list_service_offers(vendor_id, "restaurant")
    assert shown["kind"] == "in_venue"
    assert shown["label"] == "Buy one, get one free"
    assert shown["terms"] == "Buy any main course, get a second free."


@pytest.mark.parametrize(
    ("promotion", "error"),
    [
        ({"offer_type": "bogo", "terms": ""}, "terms"),
        ({"offer_type": "food_percentage", "discount_value": 0}, "between 1 and 100"),
        ({"offer_type": "percentage", "discount_value": 150}, "between 1 and 100"),
    ],
)
def test_offer_type_rules(promotion, error):
    with pytest.raises(ValueError, match=error):
        promotion_types.normalize(promotion)


def test_in_venue_offer_fields_are_forced_to_dining():
    fields = promotion_types.normalize(
        {"offer_type": "menu_percentage", "discount_value": 30, "applicable_to": "Spa Only", "require_promo_code": True}
    )
    assert fields["applicable_to"] == "Dining Only"
    assert fields["require_promo_code"] is False
    assert fields["discount_value"] == 30


def test_only_restaurants_can_create_in_venue_offers():
    from app.modules.vendor.repositories_portal import VendorPortalRepository

    db, vendor_id, spa_id, _ = _setup()
    repo = VendorPortalRepository(db)
    payload = {
        "promotion_name": "Free dessert",
        "offer_type": "custom",
        "terms": "Free dessert with any main.",
        "discount_value": 0,
        "start_date": _day(0),
        "end_date": _day(10),
        "active": True,
    }

    created = repo.create_promotion(str(vendor_id), payload)
    assert created["applicable_to"] == "Dining Only"
    with pytest.raises(ValueError, match="only available for restaurants"):
        repo.create_promotion(str(spa_id), payload)
