"""Seed a year of bookings, reviews and listings for one service-provider account.

Fills the provider portal dashboard (KPIs, booking trends, calendar, bookings table,
recent reviews, occupancy) for an existing provider, e.g. a test account you
registered yourself. Uses the demo customers from scripts.seed_demo_activity, so run
that first.

Adds, for each of the provider's categories (Restaurant and/or Hotel):
    - Restaurant: a small menu and table bookings.
    - Hotel: two room types and room bookings, including check-ins today.

Everything is tagged with SEED_TAG and only touches the given provider; re-running
replaces the previous data.

Usage (from the api/ folder):
    .venv/Scripts/python.exe -m scripts.seed_vendor_activity provider@example.com
    .venv/Scripts/python.exe -m scripts.seed_vendor_activity provider@example.com --remove
"""

import sys
from datetime import UTC, datetime, timedelta

import httpx
from pymongo import MongoClient

from app.core.config import get_settings
from scripts.seed_demo_activity import REVIEW_TEXTS, SEED_TAG as DEMO_SEED_TAG, insert_booking, insert_review
from scripts.seed_dummy_providers import img, upload_seed_image

SEED_TAG = "vendor-activity-v1"
SEEDED_COLLECTIONS = ("vendor_bookings", "bookings", "vendor_reviews", "vendor_rooms", "vendor_services", "vendor_assets")

GALLERY = {
    "restaurant": ("photo-1517248135467-4c7edcad34c4", "photo-1590846406792-0adc7f938f1d", "photo-1600891964599-f61ba0e24092", "photo-1546069901-ba9599a7e63c", "photo-1514362545857-3bc16c4c7d1b"),
    "hotel": ("photo-1566073771259-6a8506099945", "photo-1611892440504-42a792e24d32", "photo-1590490360182-c33d57733427", "photo-1631049307264-da0ec9d70304"),
}

# Bookings requested per month, oldest first (12 months ending with the current one).
MONTHLY_BOOKINGS = [4, 5, 5, 6, 8, 7, 9, 10, 12, 11, 14]

MENU = [
    ("Chicken Biryani", "Kacchi-style biryani with tender chicken.", 380, "Main Course"),
    ("Beef Tehari", "Fragrant rice with spiced beef.", 320, "Main Course"),
    ("Prawn Malai Curry", "Prawns in a mild coconut curry.", 520, "Main Course"),
    ("Mixed Grill Platter", "Chicken tikka, seekh kebab and naan.", 950, "Platters"),
    ("Mango Lassi", "Fresh mango yogurt drink.", 150, "Drinks"),
    ("Firni", "Chilled rice pudding.", 120, "Desserts"),
]

# (name, bed type, beds, max guests, size m2, weekday price, weekend price, rooms of this type)
ROOMS = [
    ("Deluxe King", "King", 1, 2, 32, 6500, 7500, 6),
    ("Family Suite", "Queen", 2, 4, 48, 9800, 11000, 4),
]


def remove_seed(db, vendor_id) -> int:
    return sum(
        db[name].delete_many({"seed_tag": SEED_TAG, "vendor_id": vendor_id}).deleted_count
        for name in SEEDED_COLLECTIONS
    )


def seed_gallery(db, vendor: dict, types: list[str], now: datetime) -> int:
    """Gallery photos (copied to the app's S3 bucket) for each of the provider's services."""
    settings = get_settings()
    rows = []
    with httpx.Client() as http:
        for service_type in types:
            for photo_id in GALLERY.get(service_type, ()):
                url = upload_seed_image(settings, img(photo_id), http)
                rows.append({
                    "seed_tag": SEED_TAG, "vendor_id": vendor["_id"], "asset_type": "gallery", "asset_url": url,
                    "service_type": service_type, "file_name": f"{photo_id}.jpg", "mime_type": "image/jpeg",
                    "created_at": now, "updated_at": now,
                })
    if rows:
        db.vendor_assets.insert_many(rows)
    return len(rows)


def seed_listings(db, vendor: dict, categories: set[str], now: datetime) -> list[dict]:
    """Add menu items and rooms; returns the rooms (hotel bookings need them)."""
    base = {"seed_tag": SEED_TAG, "vendor_id": vendor["_id"], "created_at": now, "updated_at": now}
    room_image = (db.vendor_rooms.find_one({"images.0": {"$exists": True}}) or {}).get("images", [])[:1]
    dish_image = (db.vendor_services.find_one({"images.0": {"$exists": True}}) or {}).get("images", [])[:1]
    if "restaurant" in categories:
        db.vendor_services.insert_many([
            {**base, "name": name, "description": description, "price": float(price), "category": category,
             "service_type": "restaurant", "available": True, "active_status": True, "images": dish_image}
            for name, description, price, category in MENU
        ])
    rooms: list[dict] = []
    if "hotel" in categories:
        for name, bed, beds, guests, size, price, weekend, count in ROOMS:
            room = {
                **base, "name": name, "description": f"{name} at {vendor['business_name']}.", "bed_type": bed,
                "number_of_beds": beds, "max_guests": guests, "size_sqm": size, "base_price": float(price),
                "weekend_price": float(weekend), "default_discount_percent": 0.0, "inventory_count": count,
                "min_stay_nights": 1, "max_stay_nights": 14, "amenities": ["Free WiFi", "Air Conditioning", "Smart TV"],
                "images": room_image, "available": True, "active_status": True,
            }
            room["_id"] = db.vendor_rooms.insert_one(room).inserted_id
            rooms.append(room)
    return rooms


def main() -> None:
    args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    if not args:
        sys.exit("Usage: python -m scripts.seed_vendor_activity <provider email> [--remove]")
    email = args[0].strip().lower()

    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_db_name]
        vendor = db.vendors.find_one({"email": email})
        if not vendor:
            sys.exit(f"No service provider with email {email}.")
        print(f"Removed {remove_seed(db, vendor['_id'])} previously seeded documents for {vendor['business_name']}.")
        if "--remove" in sys.argv:
            return

        categories = {str(c).strip().lower() for c in (vendor.get("categories") or [vendor.get("category")]) if c}
        types = [t for t in ("restaurant", "hotel") if t in categories]
        if not types:
            sys.exit("This script seeds Restaurant and Hotel providers only.")
        customers = list(db.users.find({"seed_tag": DEMO_SEED_TAG, "email": {"$regex": r"^demo\.customer"}}).sort("email", 1))
        if not customers:
            sys.exit("Demo customers not found. Run scripts.seed_demo_activity first.")

        now = datetime.now(UTC)
        today = now.replace(hour=12, minute=0, second=0, microsecond=0)
        rooms = seed_listings(db, vendor, categories, now)
        photos = seed_gallery(db, vendor, types, now)
        booking_ids = []
        counter = 0

        def book(provider_type: str, created_at: datetime, scheduled: datetime, status: str) -> None:
            nonlocal counter
            counter += 1
            customer = customers[counter % len(customers)]
            guests = 2 + counter % 4
            if provider_type == "hotel":
                room = rooms[counter % len(rooms)]
                guests = min(guests, room["max_guests"])
                extras, amount, time = {"room": room}, room["base_price"] * 2, "02:00 PM"
            else:
                extras, amount, time = {}, (300 + (counter * 70) % 400) * guests, ("01:00 PM", "07:30 PM", "09:00 PM")[counter % 3]
            booking_id = insert_booking(
                db, customer=customer, vendor=vendor, provider_type=provider_type, scheduled=scheduled,
                time=time, guests=guests, amount=amount, status=status, created_at=created_at, **extras,
            )
            booking_ids.append(booking_id)
            if status == "complete" and counter % 5 != 0:
                rating = (5, 4, 5, 5, 4, 3)[counter % 6]
                texts = REVIEW_TEXTS[rating]
                insert_review(
                    db, customer=customer, vendor_id=vendor["_id"], booking_id=booking_id, provider_type=provider_type,
                    rating=rating, text=texts[counter % len(texts)], created_at=min(scheduled + timedelta(days=1), now - timedelta(hours=1)),
                )

        # Past months: requested across the month, mostly completed, some cancelled.
        this_month = today.replace(day=1)
        for offset, count in enumerate(MONTHLY_BOOKINGS):
            months_back = len(MONTHLY_BOOKINGS) - offset
            year, month = divmod(this_month.year * 12 + this_month.month - 1 - months_back, 12)
            month_start = this_month.replace(year=year, month=month + 1)
            for n in range(count):
                created_at = month_start + timedelta(days=(n * 7 + offset) % 27, hours=10 + n % 8)
                status = "canceled" if (n + offset) % 9 == 0 else "complete"
                book(types[n % len(types)], created_at, created_at + timedelta(days=1 + n % 4), status)

        # This month: finished stays/meals, today's bookings and upcoming ones.
        days_so_far = max((today - this_month).days, 1)
        for n in range(6):
            created_at = this_month + timedelta(days=n % days_so_far, hours=9 + n)
            scheduled = min(created_at + timedelta(days=1), today - timedelta(days=1))
            book(types[n % len(types)], created_at, max(scheduled, created_at), "complete")
        if "hotel" in types:
            for n in range(5):  # guests checking in today drive the occupancy rate
                book("hotel", now - timedelta(days=2 + n, hours=n), today, "check_in" if n < 3 else "confirmed")
        if "restaurant" in types:
            for n in range(3):
                book("restaurant", now - timedelta(days=1, hours=n * 3), today, "confirmed")
        for n in range(8):
            created_at = now - timedelta(hours=2 + n * 5)
            book(types[n % len(types)], created_at, today + timedelta(days=2 + n * 3), "pending" if n % 3 == 0 else "confirmed")

        # insert_booking/insert_review tag rows as demo activity; re-tag them so this seed owns them.
        vendor_rows = {"vendor_id": vendor["_id"], "seed_tag": DEMO_SEED_TAG}
        for name in ("vendor_bookings", "bookings", "vendor_reviews"):
            db[name].update_many(vendor_rows, {"$set": {"seed_tag": SEED_TAG}})

        reviews = db.vendor_reviews.count_documents({"seed_tag": SEED_TAG, "vendor_id": vendor["_id"]})
        print(
            f"Seeded {len(booking_ids)} bookings, {reviews} reviews, {len(rooms)} room types, {photos} gallery photos"
            f"{' and a menu' if 'restaurant' in types else ''} for {vendor['business_name']}."
        )
    finally:
        client.close()


if __name__ == "__main__":
    main()
