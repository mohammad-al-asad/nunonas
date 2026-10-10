"""Seed dummy service providers (restaurants, hotels, spas, events, happy hours).

Every document is tagged with SEED_TAG so the data can be replaced or removed
without touching real vendors.

Usage (from the api/ folder):
    .venv/Scripts/python.exe -m scripts.seed_dummy_providers           # (re)seed
    .venv/Scripts/python.exe -m scripts.seed_dummy_providers --remove  # remove only

All dummy vendors can log in to the service-provider portal with DUMMY_PASSWORD.

Images are copied from Unsplash into the configured S3 bucket (same bucket,
prefix and cache headers as real vendor uploads) and the seeded documents point
at the S3 copies. Keys are fixed per photo, so re-seeding reuses existing files.
"""

import sys
from datetime import UTC, datetime, timedelta

import httpx
from botocore.exceptions import ClientError
from pymongo import MongoClient

from app.core.config import Settings, get_settings
from app.core.security import hash_password
from app.providers.s3_uploader import CACHE_CONTROL, _s3_client

SEED_TAG = "dummy-providers-v1"
DUMMY_PASSWORD = "Test@1234"
TIMEZONE = "Asia/Dhaka"
UNSPLASH_PREFIX = "https://images.unsplash.com/"
SEED_IMAGE_FOLDER = "seed/dummy-providers"

VENDOR_COLLECTIONS = (
    "vendors",
    "vendor_profiles",
    "vendor_business_details",
    "vendor_verification_details",
    "vendor_portal_settings",
    "restaurants",
    "hotels",
    "spas",
    "vendor_services",
    "vendor_rooms",
    "vendor_events",
    "vendor_happy_hours",
    "vendor_assets",
    "vendor_promotions",
)

SERVICE_COLLECTIONS = {"restaurant": "restaurants", "hotel": "hotels", "spa": "spas"}


def img(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?w=900&q=80"


PROVIDERS = [
    {
        "business_name": "Spice Garden",
        "owner": "Rahim Uddin",
        "email": "dummy.spicegarden@nununas.test",
        "phone": "01711000001",
        "category": "Restaurant",
        "service": {
            "name": "Spice Garden",
            "about": "Authentic Bangladeshi and Mughlai dishes with a rooftop view of Gulshan.",
            "address": "Road 11, Gulshan 2, Dhaka 1212, Bangladesh",
            "city": "Dhaka",
            "latitude": 23.7925,
            "longitude": 90.4078,
            "opening_time": "11:00 AM",
            "closing_time": "11:00 PM",
            "amenities": ["Free WiFi", "Air Conditioning", "Rooftop Seating"],
            "seating_preferences": ["Indoor", "Outdoor", "Rooftops"],
            "available_booking_times": ["12:00 PM", "01:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"],
            "profile_image_url": img("photo-1517248135467-4c7edcad34c4"),
        },
        "promotion": ("25% off weekday tables", "Table bookings Monday to Friday.", 25, "Dining Only", ["0", "1", "2", "3", "4"]),
        "gallery": [img(pid) for pid in ("photo-1414235077428-338989a2e8c0", "photo-1555396273-367ea4eb4db5", "photo-1590846406792-0adc7f938f1d", "photo-1600891964599-f61ba0e24092", "photo-1565299624946-b28f40a0ae38")],
        "menu": [
            ("Kacchi Biryani", "Mutton kacchi with aloo and borhani", 450, "Main Course"),
            ("Chicken Tikka", "Charcoal grilled, served with naan", 380, "Starters"),
            ("Mango Lassi", "Fresh yogurt and mango", 150, "Drinks"),
        ],
        "happy_hour": {
            "title": "Sunset Lassi Hour",
            "offer_text": "30% off all drinks",
            "original_price": 150,
            "happy_hour_price": 105,
            "discount_percent": 30,
            "start_time": "16:00",
            "end_time": "19:00",
        },
    },
    {
        "business_name": "Lakeview Café",
        "owner": "Nusrat Jahan",
        "email": "dummy.lakeviewcafe@nununas.test",
        "phone": "01711000002",
        "category": "Restaurant",
        "service": {
            "name": "Lakeview Café",
            "about": "Cosy café by Dhanmondi Lake serving coffee, pasta and desserts.",
            "address": "Road 8A, Dhanmondi, Dhaka 1209, Bangladesh",
            "city": "Dhaka",
            "latitude": 23.7461,
            "longitude": 90.3742,
            "opening_time": "08:00 AM",
            "closing_time": "10:30 PM",
            "amenities": ["Free WiFi", "Lake View", "Wheelchair Accessible"],
            "seating_preferences": ["Indoor", "Outdoor"],
            "available_booking_times": ["09:00 AM", "11:00 AM", "04:00 PM", "06:00 PM", "08:00 PM"],
            "profile_image_url": img("photo-1554118811-1e0d58224f24"),
        },
        "gallery": [img(pid) for pid in ("photo-1501339847302-ac426a4a7cbb", "photo-1559339352-11d035aa65de", "photo-1514362545857-3bc16c4c7d1b", "photo-1424847651672-bf20a4b0982b", "photo-1546069901-ba9599a7e63c")],
        "menu": [
            ("Cappuccino", "Double shot with steamed milk", 220, "Coffee"),
            ("Creamy Alfredo Pasta", "Chicken and mushroom", 520, "Main Course"),
            ("Chocolate Lava Cake", "Served warm with ice cream", 320, "Desserts"),
        ],
        "happy_hour": {
            "title": "Coffee Happy Hour",
            "offer_text": "2 coffees for the price of 1",
            "original_price": 440,
            "happy_hour_price": 220,
            "discount_percent": 50,
            "start_time": "15:00",
            "end_time": "18:00",
        },
    },
    {
        "business_name": "The Banani Grand",
        "owner": "Tanvir Ahmed",
        "email": "dummy.bananigrand@nununas.test",
        "phone": "01711000003",
        "category": "Hotel",
        "service": {
            "name": "The Banani Grand",
            "about": "Modern business hotel in Banani with a pool, gym and airport shuttle.",
            "address": "Road 17, Banani, Dhaka 1213, Bangladesh",
            "city": "Dhaka",
            "latitude": 23.7937,
            "longitude": 90.4043,
            "opening_time": "12:00 AM",
            "closing_time": "11:59 PM",
            "amenities": ["Free WiFi", "Swimming Pool", "Gym", "Parking", "Airport Shuttle"],
            "profile_image_url": img("photo-1566073771259-6a8506099945"),
        },
        "promotion": ("15% off weekend stays", "Friday and Saturday check-ins.", 15, "Hotel Only", ["4", "5"]),
        "gallery": [img(pid) for pid in ("photo-1542314831-068cd1dbfeeb", "photo-1566073771259-6a8506099945", "photo-1611892440504-42a792e24d32", "photo-1590490360182-c33d57733427", "photo-1571896349842-33c89424de2d")],
        "rooms": [
            ("Deluxe King Room", "King Size", 1, 2, 32, 8500, 9500, img("photo-1618773928121-c32242e63f39")),
            ("Twin Executive Room", "Twin", 2, 2, 30, 7800, 8800, img("photo-1590490360182-c33d57733427")),
            ("Family Suite", "King Size", 2, 4, 55, 14500, 16000, img("photo-1566665797739-1674de7a421a")),
        ],
    },
    {
        "business_name": "Comilla Heritage Inn",
        "owner": "Kamal Hossain",
        "email": "dummy.comillaheritage@nununas.test",
        "phone": "01711000004",
        "category": "Hotel",
        "service": {
            "name": "Comilla Heritage Inn",
            "about": "Boutique stay near Kandirpar with local cuisine and garden courtyard.",
            "address": "Kandirpar, Comilla 3500, Bangladesh",
            "city": "Comilla",
            "latitude": 23.4607,
            "longitude": 91.1809,
            "opening_time": "12:00 AM",
            "closing_time": "11:59 PM",
            "amenities": ["Free WiFi", "Garden", "Restaurant", "Parking"],
            "profile_image_url": img("photo-1551882547-ff40c63fe5fa"),
        },
        "gallery": [img(pid) for pid in ("photo-1520250497591-112f2f40a3f4", "photo-1582719478250-c89cae4dc85b", "photo-1578683010236-d716f9a3f461", "photo-1631049307264-da0ec9d70304", "photo-1566073771259-6a8506099945")],
        "rooms": [
            ("Standard Double", "Queen Size", 1, 2, 24, 4200, 4800, img("photo-1611892440504-42a792e24d32")),
            ("Garden Suite", "King Size", 1, 3, 40, 6500, 7200, img("photo-1582719478250-c89cae4dc85b")),
        ],
    },
    {
        "business_name": "Lotus Wellness Spa",
        "owner": "Farhana Akter",
        "email": "dummy.lotusspa@nununas.test",
        "phone": "01711000005",
        "category": "Spa",
        "service": {
            "name": "Lotus Wellness Spa",
            "about": "Thai and aromatherapy massages, facials and a steam lounge in Gulshan 1.",
            "address": "Road 35, Gulshan 1, Dhaka 1212, Bangladesh",
            "city": "Dhaka",
            "latitude": 23.7806,
            "longitude": 90.4169,
            "opening_time": "10:00 AM",
            "closing_time": "10:00 PM",
            "amenities": ["Sauna", "Steam Room", "Changing Room", "Relaxation Lounge"],
            "profile_image_url": img("photo-1540555700478-4be289fbecef"),
        },
        "promotion": ("20% off weekday treatments", "Spa bookings Monday to Friday.", 20, "Spa Only", ["0", "1", "2", "3", "4"]),
        "gallery": [img(pid) for pid in ("photo-1544161515-4ab6ce6db874", "photo-1600334089648-b0d9d3028eb2", "photo-1540555700478-4be289fbecef", "photo-1519823551278-64ac92734fb1", "photo-1515377905703-c4788e51af15")],
        "menu": [
            ("Thai Massage (60 min)", "Traditional full-body stretch massage", 3500, "Massage"),
            ("Aromatherapy (90 min)", "Essential oil relaxation massage", 4800, "Massage"),
            ("Gold Facial", "Brightening facial treatment", 2800, "Facial"),
        ],
        "happy_hour": {
            "title": "Midweek Relax Hour",
            "offer_text": "25% off all massages",
            "original_price": 3500,
            "happy_hour_price": 2625,
            "discount_percent": 25,
            "start_time": "13:00",
            "end_time": "16:00",
        },
    },
    {
        "business_name": "Feni Food Court",
        "owner": "Sabbir Rahman",
        "email": "dummy.fenifoodcourt@nununas.test",
        "phone": "01711000006",
        "category": "Restaurant",
        "service": {
            "name": "Feni Food Court",
            "about": "Family food court with local favourites, fast food and fresh juice.",
            "address": "Trunk Road, Feni 3900, Bangladesh",
            "city": "Feni",
            "latitude": 23.0159,
            "longitude": 91.3976,
            "opening_time": "10:00 AM",
            "closing_time": "11:00 PM",
            "amenities": ["Family Friendly", "Air Conditioning", "Parking"],
            "seating_preferences": ["Indoor"],
            "available_booking_times": ["12:00 PM", "02:00 PM", "07:00 PM", "09:00 PM"],
            "profile_image_url": img("photo-1552566626-52f8b828add9"),
        },
        "gallery": [img(pid) for pid in ("photo-1504674900247-0877df9cc836", "photo-1552566626-52f8b828add9", "photo-1466978913421-dad2ebd01d17", "photo-1540189549336-e6e99c3679fe", "photo-1517248135467-4c7edcad34c4")],
        "menu": [
            ("Beef Tehari", "Feni-style spicy tehari", 250, "Main Course"),
            ("Chicken Burger", "Crispy chicken with fries", 280, "Fast Food"),
        ],
    },
    {
        "business_name": "Dhaka Live Events",
        "owner": "Arif Chowdhury",
        "email": "dummy.dhakaliveevents@nununas.test",
        "phone": "01711000007",
        "category": "Event",
        "service": {
            "name": "Dhaka Live Events",
            "about": "Concerts, food festivals and cultural nights across Dhaka.",
            "address": "Hatirjheel, Dhaka 1219, Bangladesh",
            "city": "Dhaka",
            "latitude": 23.7713,
            "longitude": 90.4110,
            "opening_time": "05:00 PM",
            "closing_time": "11:30 PM",
            "amenities": ["Security", "Food Available", "Family Friendly"],
            "profile_image_url": img("photo-1492684223066-81342ee5ff30"),
        },
        "gallery": [img(pid) for pid in ("photo-1492684223066-81342ee5ff30", "photo-1501281668745-f7f57925c3b4", "photo-1514525253161-7a46d19cd819", "photo-1470229722913-7c0e2dbbafd3")],
        "events": [
            ("Hatirjheel Live Music Night", "Music", 7, "18:00", "22:30", 800.0, 500, "Hatirjheel Amphitheatre, Dhaka", 23.7713, 90.4110, img("photo-1470229722913-7c0e2dbbafd3")),
            ("Dhaka Street Food Festival", "Food & Drink", 12, "15:00", "22:00", 300.0, 2000, "Army Stadium, Banani, Dhaka", 23.7970, 90.4020, img("photo-1555939594-58d7cb561ad1")),
            ("Classical Music Evening", "Culture", 20, "19:00", "21:30", 1200.0, 300, "Shilpakala Academy, Segunbagicha, Dhaka", 23.7345, 90.4053, img("photo-1465847899084-d164df4dedc6")),
        ],
    },
]


def upload_seed_image(settings: Settings, url: str, http: httpx.Client) -> str:
    """Copy one Unsplash image into S3 (skipping it if already there) and return its public URL."""
    if not settings.s3_bucket_name or not settings.aws_region:
        raise RuntimeError("S3 is not configured (S3_BUCKET_NAME / AWS_REGION in api/.env).")
    photo_id = url.removeprefix(UNSPLASH_PREFIX).split("?", 1)[0]
    key = "/".join(part for part in (settings.s3_prefix.strip("/"), SEED_IMAGE_FOLDER, f"{photo_id}.jpg") if part)
    client = _s3_client(settings.aws_region, settings.aws_access_key_id, settings.aws_secret_access_key)
    try:
        client.head_object(Bucket=settings.s3_bucket_name, Key=key)
    except ClientError as exc:
        # Without s3:ListBucket, S3 answers 403 instead of 404 for a missing key.
        # Keys are fixed per photo, so uploading again just overwrites the same object.
        if exc.response.get("Error", {}).get("Code") not in {"403", "404", "NoSuchKey", "NotFound"}:
            raise
        response = http.get(url, follow_redirects=True, timeout=60)
        response.raise_for_status()
        client.put_object(Bucket=settings.s3_bucket_name, Key=key, Body=response.content, ContentType="image/jpeg", CacheControl=CACHE_CONTROL)
        print(f"  uploaded {key}")
    base_url = (settings.s3_public_base_url or f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com").rstrip("/")
    return f"{base_url}/{key}"


def providers_with_s3_images(settings: Settings) -> list[dict]:
    """Return PROVIDERS with every Unsplash URL replaced by its S3 copy."""
    uploaded: dict[str, str] = {}
    with httpx.Client() as http:
        def swap(value):
            if isinstance(value, str) and value.startswith(UNSPLASH_PREFIX):
                if value not in uploaded:
                    uploaded[value] = upload_seed_image(settings, value, http)
                return uploaded[value]
            if isinstance(value, dict):
                return {key: swap(item) for key, item in value.items()}
            if isinstance(value, (list, tuple)):
                return type(value)(swap(item) for item in value)
            return value

        providers = [swap(provider) for provider in PROVIDERS]
    print(f"{len(uploaded)} provider images available in S3.")
    return providers


def seed_promotion(db, vendor_id, provider: dict, now: datetime) -> None:
    if not provider.get("promotion"):
        return
    name, description, percent, applicable_to, recurring_days = provider["promotion"]
    today = now.date()
    db.vendor_promotions.insert_one({
        "seed_tag": SEED_TAG,
        "vendor_id": vendor_id,
        "promotion_name": name,
        "internal_description": description,
        "offer_type": "percentage",
        "discount_value": float(percent),
        "applicable_to": applicable_to,
        "start_date": (today - timedelta(days=1)).isoformat(),
        "end_date": (today + timedelta(days=90)).isoformat(),
        "recurring_days": recurring_days,
        "require_promo_code": False,
        "promo_code": None,
        "first_time_customers_only": False,
        "minimum_spend": None,
        "active": True,
        "usage_count": 0,
        "total_promo_revenue": 0.0,
        "created_at": now,
        "updated_at": now,
    })


def seed_vendor(db, provider: dict, now: datetime) -> None:
    tag = {"seed_tag": SEED_TAG}
    category = provider["category"]
    service_type = category.lower()
    settings = {**provider["service"], "email": provider["email"], "phone": provider["phone"], "policy": "Free cancellation up to 24 hours before.", "published": True}

    vendor_id = db.vendors.insert_one({
        **tag,
        "business_name": provider["business_name"],
        "owner_full_name": provider["owner"],
        "email": provider["email"],
        "phone": provider["phone"],
        "password_hash": hash_password(DUMMY_PASSWORD),
        "role": "vendor",
        "category": category,
        "categories": [category],
        "status": "approved",
        "kyc_status": "approved",
        "kyc_submitted_at": now.isoformat(),
        "kyc_reviewed_at": now,
        "kyc_rejection_reason": None,
        "terms_accepted": True,
        "terms_accepted_at": now.isoformat(),
        "vendor_code": "".join(word[0] for word in provider["business_name"].split()[:2]).upper(),
        "created_at": now,
        "updated_at": now,
    }).inserted_id
    base = {**tag, "vendor_id": vendor_id, "created_at": now, "updated_at": now}

    db.vendor_profiles.insert_one({**base, "business_name": provider["business_name"], "owner_full_name": provider["owner"], "email": provider["email"], "phone": provider["phone"], "category": category, "categories": [category]})
    db.vendor_business_details.insert_one({**base, "address": settings["address"], "city": settings["city"], "business_description": settings["about"], "business_location_label": f"{settings['address']} ({settings['latitude']}, {settings['longitude']})", "categories": [category], "website": None})
    db.vendor_verification_details.insert_one({**base, "category": category, "categories": [category], "status": "approved", "trade_license_number": f"DUMMY-{str(vendor_id)[-6:]}", "submitted_at": now, "reviewed_at": now, "rejection_reason": None})
    db.vendor_portal_settings.insert_one({
        **base,
        "general": {"business_address": settings["address"], "latitude": settings["latitude"], "longitude": settings["longitude"]},
        "profile": {
            "business_name": provider["business_name"],
            "owner_full_name": provider["owner"],
            "email_address": provider["email"],
            "phone_number": provider["phone"],
            "about_business": settings["about"],
            "category": category,
            "categories": [category],
            "location_label": settings["address"],
            "latitude": settings["latitude"],
            "longitude": settings["longitude"],
            "avatar_url": settings["profile_image_url"],
            f"{service_type}_settings": settings,
        },
    })

    if service_type in SERVICE_COLLECTIONS:
        db[SERVICE_COLLECTIONS[service_type]].insert_one({**base, **settings, "service_type": service_type, "available_booking_times": settings.get("available_booking_times", []), "seating_preferences": settings.get("seating_preferences", [])})

    for url in provider.get("gallery", []):
        db.vendor_assets.insert_one({**base, "asset_type": "gallery", "asset_url": url, "service_type": service_type, "file_name": url.rsplit("/", 1)[-1], "mime_type": "image/jpeg"})

    for name, description, price, menu_category in provider.get("menu", []):
        db.vendor_services.insert_one({**base, "name": name, "description": description, "price": float(price), "category": menu_category, "service_type": service_type, "available": True, "active_status": True, "images": [settings["profile_image_url"]]})

    for name, bed, beds, guests, size, price, weekend, image in provider.get("rooms", []):
        db.vendor_rooms.insert_one({**base, "name": name, "description": f"{name} at {provider['business_name']}.", "bed_type": bed, "number_of_beds": beds, "max_guests": guests, "size_sqm": size, "base_price": float(price), "weekend_price": float(weekend), "default_discount_percent": 0.0, "inventory_count": 5, "min_stay_nights": 1, "max_stay_nights": 14, "amenities": ["Free WiFi", "Air Conditioning", "Smart TV"], "images": [image], "available": True, "active_status": True})

    today = now.date()
    for title, event_type, days_ahead, start, end, price, capacity, venue, lat, lng, banner in provider.get("events", []):
        event_date = (today + timedelta(days=days_ahead)).isoformat()
        db.vendor_events.insert_one({**base, "title": title, "event_type": event_type, "description": f"{title} — hosted by {provider['business_name']}.", "event_date": event_date, "end_date": event_date, "start_time": start, "end_time": end, "timezone": TIMEZONE, "venue": venue, "latitude": lat, "longitude": lng, "capacity": capacity, "ticket_price": price, "registration_deadline": (today + timedelta(days=days_ahead - 1)).isoformat(), "banner_image_url": banner, "status": "published", "active": True, "active_status": True})

    seed_promotion(db, vendor_id, provider, now)

    happy_hour = provider.get("happy_hour")
    if happy_hour:
        db.vendor_happy_hours.insert_one({**base, **happy_hour, "venue": settings["name"], "venue_type": service_type, "description": f"{happy_hour['offer_text']} at {settings['name']}.", "terms_and_conditions": "Dine-in only. Cannot be combined with other offers.", "start_date": (today - timedelta(days=1)).isoformat(), "end_date": (today + timedelta(days=90)).isoformat(), "days_of_week": [], "timezone": TIMEZONE, "latitude": settings["latitude"], "longitude": settings["longitude"], "banner_image_url": settings["profile_image_url"], "status": "published", "active": True})


def main() -> None:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    removed = sum(db[name].delete_many({"seed_tag": SEED_TAG}).deleted_count for name in VENDOR_COLLECTIONS)
    print(f"Removed {removed} previously seeded documents.")
    if "--remove" in sys.argv:
        client.close()
        return

    now = datetime.now(UTC)
    for provider in providers_with_s3_images(settings):
        seed_vendor(db, provider, now)
        print(f"Seeded {provider['category']:<10} {provider['business_name']} ({provider['service']['city']}) — login {provider['email']}")
    print(f"Done. Portal password for all dummy vendors: {DUMMY_PASSWORD}")
    client.close()


if __name__ == "__main__":
    main()
