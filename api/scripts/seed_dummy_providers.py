"""Seed dummy service providers (restaurants, hotels, spas, events, happy hours).

Every document is tagged with SEED_TAG so the data can be replaced or removed
without touching real vendors.

Usage (from the api/ folder):
    .venv/Scripts/python.exe -m scripts.seed_dummy_providers           # (re)seed
    .venv/Scripts/python.exe -m scripts.seed_dummy_providers --remove  # remove only

All dummy vendors can log in to the service-provider portal with DUMMY_PASSWORD.
"""

import sys
from datetime import UTC, datetime, timedelta

from pymongo import MongoClient

from app.core.config import get_settings
from app.core.security import hash_password

SEED_TAG = "dummy-providers-v1"
DUMMY_PASSWORD = "Test@1234"
TIMEZONE = "Asia/Dhaka"

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
            "special_offers": [{"title": "Buy 1 Get 1 Kacchi", "description": "Every weekday lunch", "active": True}],
        },
        "gallery": [img("photo-1414235077428-338989a2e8c0"), img("photo-1555396273-367ea4eb4db5")],
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
            "special_offers": [],
        },
        "gallery": [img("photo-1501339847302-ac426a4a7cbb")],
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
            "special_offers": [{"title": "15% off weekend stays", "description": "Fri-Sat nights", "active": True}],
        },
        "gallery": [img("photo-1542314831-068cd1dbfeeb")],
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
            "special_offers": [],
        },
        "gallery": [img("photo-1520250497591-112f2f40a3f4")],
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
            "special_offers": [{"title": "20% off couple massage", "description": "Weekdays before 5 PM", "active": True}],
        },
        "gallery": [img("photo-1544161515-4ab6ce6db874")],
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
            "special_offers": [],
        },
        "gallery": [img("photo-1504674900247-0877df9cc836")],
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
            "special_offers": [],
        },
        "gallery": [],
        "events": [
            ("Hatirjheel Live Music Night", "Music", 7, "18:00", "22:30", 800.0, 500, "Hatirjheel Amphitheatre, Dhaka", 23.7713, 90.4110, img("photo-1470229722913-7c0e2dbbafd3")),
            ("Dhaka Street Food Festival", "Food & Drink", 12, "15:00", "22:00", 300.0, 2000, "Army Stadium, Banani, Dhaka", 23.7970, 90.4020, img("photo-1555939594-58d7cb561ad1")),
            ("Classical Music Evening", "Culture", 20, "19:00", "21:30", 1200.0, 300, "Shilpakala Academy, Segunbagicha, Dhaka", 23.7345, 90.4053, img("photo-1465847899084-d164df4dedc6")),
        ],
    },
]


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
    for provider in PROVIDERS:
        seed_vendor(db, provider, now)
        print(f"Seeded {provider['category']:<10} {provider['business_name']} ({provider['service']['city']}) — login {provider['email']}")
    print(f"Done. Portal password for all dummy vendors: {DUMMY_PASSWORD}")
    client.close()


if __name__ == "__main__":
    main()
