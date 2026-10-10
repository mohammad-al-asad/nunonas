"""Seed a complete demo dataset: admin login, providers, customers, bookings and reviews.

Builds on scripts/seed_dummy_providers.py (re-seeds those providers first) and
adds activity so the mobile home screen (trending, featured, upcoming booking)
and the platform-admin dashboard have something to show.

Everything is tagged with SEED_TAG (or the provider seed tag) so it can be
removed without touching real data.

Usage (from the api/ folder):
    .venv/Scripts/python.exe -m scripts.seed_demo_activity           # (re)seed
    .venv/Scripts/python.exe -m scripts.seed_demo_activity --remove  # remove only

Logins created (credentials come from SEED_DEMO_EMAIL / SEED_DEMO_PASSWORD in api/.env):
    Dashboard (platform admin): DEMO_EMAIL / DEMO_PASSWORD
    Mobile app (customer):      DEMO_EMAIL / DEMO_PASSWORD
    Service-provider portal:    see seed_dummy_providers (password Test@1234)
"""

import os
import sys
from datetime import UTC, datetime, timedelta

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

from app.core.config import get_settings
from app.core.security import hash_password
from scripts import seed_demo_extras
from scripts.seed_dummy_providers import PROVIDERS, SEED_TAG as PROVIDER_SEED_TAG, VENDOR_COLLECTIONS, providers_with_s3_images, seed_vendor

SEED_TAG = "demo-activity-v1"
load_dotenv()
# Kept out of the repo: the demo login doubles as a platform-admin account.
DEMO_EMAIL = os.getenv("SEED_DEMO_EMAIL", "").strip().lower()
DEMO_PASSWORD = os.getenv("SEED_DEMO_PASSWORD", "")
DEMO_NAME = "Mohammad Al Asad"
# Gulshan 2, Dhaka — within 50 km of the Dhaka providers so "nearby" feeds fill up.
DEMO_LOCATION = (23.7925, 90.4078)

ACTIVITY_COLLECTIONS = ("users", "vendor_bookings", "bookings", "vendor_reviews", "notifications", "customer_saved_items")

OTHER_CUSTOMERS = [
    ("Ayesha Siddiqua", "female", "1999-06-14"),
    ("Imran Hossain", "male", "1991-02-03"),
    ("Sadia Islam", "female", "2002-11-27"),
    ("Rafiq Ahmed", "male", "1983-08-09"),
    ("Tasnim Rahman", "female", "1996-04-18"),
    ("Nayeem Khan", "male", "2006-01-30"),
    ("Mitu Begum", "female", "1975-12-05"),
    ("Shakil Mahmud", "male", "1962-07-22"),
]

REVIEW_TEXTS = {
    5: ["Absolutely loved it, will be back!", "Excellent service and great atmosphere.", "Best experience I've had in Dhaka."],
    4: ["Really good, a little crowded on the weekend.", "Great value, staff were friendly.", "Very nice — would recommend."],
    3: ["Decent, but the wait was long.", "Okay experience overall."],
}

# (vendor email, provider_type, days from today, time, guests, amount, status) for the demo customer.
DEMO_BOOKINGS = [
    ("dummy.spicegarden@nununas.test", "restaurant", 2, "08:00 PM", 4, 1800, "confirmed"),
    ("dummy.bananigrand@nununas.test", "hotel", 9, "03:00 PM", 2, 17000, "pending"),
    ("dummy.lotusspa@nununas.test", "spa", 5, "02:00 PM", 2, 7000, "confirmed"),
    ("dummy.dhakaliveevents@nununas.test", "event", 7, "18:00", 2, 1600, "confirmed"),
    ("dummy.lakeviewcafe@nununas.test", "restaurant", -6, "07:00 PM", 2, 960, "complete"),
    ("dummy.lotusspa@nununas.test", "spa", -20, "01:00 PM", 1, 3500, "complete"),
    ("dummy.bananigrand@nununas.test", "hotel", -45, "03:00 PM", 2, 8500, "complete"),
    ("dummy.fenifoodcourt@nununas.test", "restaurant", -12, "09:00 PM", 3, 750, "canceled"),
]

# Extra bookings by other customers drive trending scores and dashboard revenue: (vendor email, provider_type, count).
CROWD_BOOKINGS = [
    ("dummy.spicegarden@nununas.test", "restaurant", 9),
    ("dummy.bananigrand@nununas.test", "hotel", 7),
    ("dummy.lotusspa@nununas.test", "spa", 6),
    ("dummy.dhakaliveevents@nununas.test", "event", 8),
    ("dummy.lakeviewcafe@nununas.test", "restaurant", 5),
    ("dummy.comillaheritage@nununas.test", "hotel", 3),
    ("dummy.fenifoodcourt@nununas.test", "restaurant", 3),
]

UNIT_PRICE = {"restaurant": 450, "hotel": 8500, "spa": 3500, "event": 800}
SERVICE_LABEL = {"restaurant": "Table Booking", "hotel": "Room Booking", "spa": "Spa Appointment", "event": "Event Ticket"}


def remove_seed(db, keep_logins: bool) -> int:
    # Re-seeding keeps the demo app/dashboard accounts (and their ids), so devices
    # that are already logged in stay logged in. --remove deletes them too.
    keep = {"email": {"$ne": DEMO_EMAIL}} if keep_logins else {}
    removed = sum(
        db[name].delete_many({"seed_tag": SEED_TAG, **(keep if name == "users" else {})}).deleted_count
        for name in ACTIVITY_COLLECTIONS
    )
    removed += db.platform_admins.delete_many({"seed_tag": SEED_TAG, **keep}).deleted_count
    removed += sum(db[name].delete_many({"seed_tag": PROVIDER_SEED_TAG}).deleted_count for name in VENDOR_COLLECTIONS)
    return removed


def seed_admin(db, now: datetime) -> None:
    db.platform_admins.update_one(
        {"email": DEMO_EMAIL},
        {
            "$set": {
                "full_name": DEMO_NAME,
                "password_hash": hash_password(DEMO_PASSWORD),
                "role": "platform_admin",
                "status": "active",
                "seed_tag": SEED_TAG,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


def seed_customer(db, full_name: str, email: str, phone: str, gender: str, location: tuple[float, float], created_at: datetime, password: str, date_of_birth: str | None = None) -> dict:
    doc = {
        "seed_tag": SEED_TAG,
        "full_name": full_name,
        "gender": gender,
        "date_of_birth": date_of_birth,
        "email": email,
        "phone": phone,
        "password_hash": hash_password(password),
        "role": "customer",
        "status": "active",
        "auth_provider": "local",
        "points_balance": 0,
        "is_active": True,
        "location_enabled": True,
        "latitude": location[0],
        "longitude": location[1],
        "created_at": created_at,
        "updated_at": created_at,
    }
    doc["_id"] = db.users.insert_one(doc).inserted_id
    return doc


def insert_booking(db, *, customer: dict, vendor: dict, provider_type: str, scheduled: datetime, time: str, guests: int, amount: float, status: str, created_at: datetime, event: dict | None = None, room: dict | None = None) -> ObjectId:
    date = scheduled.date().isoformat()
    booking_code = f"#BK{created_at.strftime('%Y%m')}-{str(ObjectId())[-4:].upper()}"
    history = [{"status": "pending", "at": created_at, "actor": "customer", "label": "Booking request sent by customer"}]
    if status in {"confirmed", "complete"}:
        history.append({"status": "confirmed", "at": created_at + timedelta(hours=1), "actor": "service_provider", "label": "Booking approved by service provider"})
    if status == "complete":
        history.append({"status": "complete", "at": scheduled + timedelta(hours=3), "actor": "service_provider", "label": "Booking completed"})
    if status == "canceled":
        history.append({"status": "canceled", "at": created_at + timedelta(hours=2), "actor": "customer", "label": "Booking cancelled by customer"})

    extra: dict = {}
    if event:
        extra = {"event_id": event["_id"], "quantity": guests, "unit_price": float(event.get("ticket_price") or 0), "service": event["title"]}
    if room:
        check_out = (scheduled + timedelta(days=2)).date().isoformat()
        extra = {"room_id": room["_id"], "room_type": room["name"], "check_in_date": date, "check_out_date": check_out, "nights": 2, "rate_per_night": float(room["base_price"])}

    payload = {
        "seed_tag": SEED_TAG,
        "vendor_id": vendor["_id"],
        "customer_id": customer["_id"],
        "booking_code": booking_code,
        "customer_name": customer["full_name"],
        "customer_gender": customer.get("gender"),
        "customer_phone": customer.get("phone"),
        "customer_email": customer.get("email"),
        "scheduled_date": date,
        "scheduled_time": time,
        "service": SERVICE_LABEL[provider_type],
        "provider_type": provider_type,
        "guests": guests,
        "status": status,
        "payment_status": "paid" if status == "complete" else "unpaid",
        "total_amount": float(amount),
        "original_subtotal": float(amount),
        "subtotal": float(amount),
        "discount_amount": 0.0,
        "estimated_points": int(amount // 100),
        "source": "customer_app",
        "requested_at": created_at,
        "accepted_at": created_at + timedelta(hours=1) if status in {"confirmed", "complete"} else None,
        "completed_at": scheduled + timedelta(hours=3) if status == "complete" else None,
        "canceled_at": created_at + timedelta(hours=2) if status == "canceled" else None,
        "status_history": history,
        "created_at": created_at,
        "updated_at": created_at,
        **extra,
    }
    booking_id = db.vendor_bookings.insert_one(payload).inserted_id
    # Mirror document read by the platform-admin dashboard.
    db.bookings.insert_one({
        "seed_tag": SEED_TAG,
        "customer_id": customer["_id"],
        "user_id": customer["_id"],
        "vendor_id": vendor["_id"],
        "provider_type": provider_type,
        "booking_id": booking_id,
        "booking_code": booking_code,
        "customer_name": customer["full_name"],
        "vendor_name": vendor["business_name"],
        "date": date,
        "time": time,
        "guests": guests,
        "status": status,
        "total_amount": float(amount),
        "discount_amount": 0.0,
        "created_at": created_at,
        "updated_at": created_at,
        **{key: value for key, value in extra.items() if key in {"event_id", "room_id", "room_type", "check_in_date", "check_out_date", "nights"}},
    })
    return booking_id


def insert_review(db, *, customer: dict, vendor_id: ObjectId, booking_id: ObjectId, provider_type: str, rating: int, text: str, created_at: datetime) -> None:
    db.vendor_reviews.insert_one({
        "seed_tag": SEED_TAG,
        "vendor_id": vendor_id,
        "booking_id": booking_id,
        "customer_id": customer["_id"],
        "customer_name": customer["full_name"],
        "customer_avatar": "",
        "rating": rating,
        "star_rating": rating,
        "review_text": text,
        "provider_type": provider_type,
        "service": SERVICE_LABEL[provider_type],
        "created_at": created_at,
        "updated_at": created_at,
    })


def main() -> None:
    if not DEMO_EMAIL or not DEMO_PASSWORD:
        sys.exit("Set SEED_DEMO_EMAIL and SEED_DEMO_PASSWORD in api/.env before seeding.")
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    removed = remove_seed(db, keep_logins="--remove" not in sys.argv) + seed_demo_extras.remove_seed(db)
    print(f"Removed {removed} previously seeded documents.")
    if "--remove" in sys.argv:
        client.close()
        return

    now = datetime.now(UTC)
    today = now.replace(hour=12, minute=0, second=0, microsecond=0)

    seed_admin(db, now)
    for provider in providers_with_s3_images(settings):
        seed_vendor(db, provider, now)
    vendors = {row["email"]: row for row in db.vendors.find({"seed_tag": PROVIDER_SEED_TAG})}
    events_by_vendor = {row["vendor_id"]: row for row in db.vendor_events.find({"seed_tag": PROVIDER_SEED_TAG}).sort("event_date", 1)}
    rooms_by_vendor = {row["vendor_id"]: row for row in db.vendor_rooms.find({"seed_tag": PROVIDER_SEED_TAG})}

    # Reuse a real app account with the demo email (e.g. created via Google sign-in) instead of clashing with it.
    demo = db.users.find_one({"email": DEMO_EMAIL}) or seed_customer(db, DEMO_NAME, DEMO_EMAIL, "01700000000", "male", DEMO_LOCATION, now - timedelta(days=170), DEMO_PASSWORD)
    others = [
        seed_customer(db, name, f"demo.customer{index}@nununas.test", f"0171200000{index}", gender, DEMO_LOCATION, now - timedelta(days=160 - index * 15), DEMO_PASSWORD, date_of_birth)
        for index, (name, gender, date_of_birth) in enumerate(OTHER_CUSTOMERS, start=1)
    ]

    def booking_extras(vendor: dict, provider_type: str) -> dict:
        if provider_type == "event":
            return {"event": events_by_vendor.get(vendor["_id"])}
        if provider_type == "hotel":
            return {"room": rooms_by_vendor.get(vendor["_id"])}
        return {}

    # Demo customer's own bookings (upcoming ones show on the home screen).
    for index, (email, provider_type, days, time, guests, amount, status) in enumerate(DEMO_BOOKINGS):
        vendor = vendors[email]
        extras = booking_extras(vendor, provider_type)
        scheduled = today + timedelta(days=days)
        if extras.get("event"):
            scheduled = datetime.fromisoformat(extras["event"]["event_date"]).replace(tzinfo=UTC)
        created_at = min(scheduled, now) - timedelta(days=3 + index)
        booking_id = insert_booking(db, customer=demo, vendor=vendor, provider_type=provider_type, scheduled=scheduled, time=time, guests=guests, amount=amount, status=status, created_at=created_at, **extras)
        if status == "complete":
            insert_review(db, customer=demo, vendor_id=vendor["_id"], booking_id=booking_id, provider_type=provider_type, rating=5, text=REVIEW_TEXTS[5][index % 3], created_at=scheduled + timedelta(days=1))

    # Other customers' history: spread over the last ~5 months so dashboard charts have shape.
    counter = 0
    for email, provider_type, count in CROWD_BOOKINGS:
        vendor = vendors[email]
        extras = booking_extras(vendor, provider_type)
        for n in range(count):
            counter += 1
            customer = others[counter % len(others)]
            days_ago = (counter * 11) % 150 + 1
            created_at = now - timedelta(days=days_ago, hours=counter % 9)
            scheduled = created_at + timedelta(days=2)
            status = "complete" if scheduled < now else "confirmed"
            if counter % 7 == 0:
                status = "canceled"
            guests = 1 + counter % 4
            amount = UNIT_PRICE[provider_type] * (2 if provider_type == "hotel" else guests)
            booking_id = insert_booking(db, customer=customer, vendor=vendor, provider_type=provider_type, scheduled=scheduled, time="07:00 PM", guests=guests, amount=amount, status=status, created_at=created_at, **extras)
            if status == "complete" and n % 3 != 2:
                rating = (5, 4, 5, 4, 3)[counter % 5]
                texts = REVIEW_TEXTS[rating]
                insert_review(db, customer=customer, vendor_id=vendor["_id"], booking_id=booking_id, provider_type=provider_type, rating=rating, text=texts[counter % len(texts)], created_at=scheduled + timedelta(days=1))

    db.notifications.insert_many([
        {"seed_tag": SEED_TAG, "user_id": demo["_id"], "title": "Booking confirmed", "body": "Spice Garden confirmed your table for 4.", "type": "booking", "read": False, "created_at": now - timedelta(hours=3)},
        {"seed_tag": SEED_TAG, "user_id": demo["_id"], "title": "New offer nearby", "body": "Lotus Wellness Spa: 20% off weekday treatments.", "type": "offer", "read": False, "created_at": now - timedelta(days=1)},
        {"seed_tag": SEED_TAG, "user_id": demo["_id"], "title": "How was Lakeview Café?", "body": "Thanks for your review!", "type": "review", "read": True, "created_at": now - timedelta(days=5)},
    ])
    db.customer_saved_items.insert_many([
        {"seed_tag": SEED_TAG, "customer_id": demo["_id"], "entity_type": entity_type, "entity_id": str(vendors[email]["_id"]), "created_at": now}
        for email, entity_type in (("dummy.spicegarden@nununas.test", "restaurant"), ("dummy.bananigrand@nununas.test", "hotel"), ("dummy.lotusspa@nununas.test", "spa"))
    ])

    # Support tickets and billing history depend on the users, providers and bookings above.
    tickets = seed_demo_extras.seed_tickets(db, now)
    paid, _ = seed_demo_extras.seed_paid_invoices(db, now)
    print(f"Seeded {tickets} support tickets and marked {paid} commission invoices paid.")
    print(f"Seeded {len(PROVIDERS)} providers, {1 + len(others)} customers, {db.vendor_bookings.count_documents({'seed_tag': SEED_TAG})} bookings, {db.vendor_reviews.count_documents({'seed_tag': SEED_TAG})} reviews.")
    print(f"Dashboard login: {DEMO_EMAIL} (password from SEED_DEMO_PASSWORD)")
    print(f"App login:       {DEMO_EMAIL} (password from SEED_DEMO_PASSWORD)")
    client.close()


if __name__ == "__main__":
    main()
