from app.modules.customer.repositories_customer import CustomerRepository


GROUPS = {
    "restaurants": [
        {"id": "r1", "name": "Spice Garden", "location": "Road 11, Gulshan 2, Dhaka", "offer_text": "25% off weekday tables"},
        {"id": "r2", "name": "Lakeview Cafe", "location": "Road 8A, Dhanmondi, Dhaka", "offer_text": None},
    ],
    "events": [
        {"id": "e1", "title": "Live Music", "location": "Hatirjheel, Dhaka", "offer_text": "Concert", "promotion_name": None},
    ],
    "hotels": [{"id": "h1", "name": "Banani Grand", "location": "Banani, Dhaka", "badge": "15% off weekend stays"}],
    "happy_hours": [{"id": "hh1", "vendor_id": "r1", "title": "Sunset Lassi Hour", "location": "Spice Garden"}],
}


def test_area_uses_the_most_specific_part_that_matches():
    matched, groups = CustomerRepository._filter_plan_area(GROUPS, "Gulshan, Dhaka")
    assert matched == "Gulshan"
    # The happy hour's address is just "Spice Garden", but it runs at the matched venue.
    assert [row["id"] for rows in groups.values() for row in rows] == ["r1", "hh1"]


def test_area_falls_back_to_the_broader_part():
    matched, groups = CustomerRepository._filter_plan_area(GROUPS, "Uttara, Dhaka")
    assert matched == "Dhaka"
    assert sorted(row["id"] for rows in groups.values() for row in rows) == ["e1", "h1", "hh1", "r1", "r2"]


def test_unknown_area_leaves_no_candidates():
    matched, groups = CustomerRepository._filter_plan_area(GROUPS, "Sylhet")
    assert matched == ""
    assert not any(groups.values())


def test_offer_text_only_counts_real_offers():
    offer = CustomerRepository._plan_offer_text
    assert offer("restaurants", GROUPS["restaurants"][0]) == "25% off weekday tables"
    assert offer("restaurants", GROUPS["restaurants"][1]) is None
    assert offer("events", GROUPS["events"][0]) is None  # "Concert" is the event type, not an offer
    assert offer("hotels", GROUPS["hotels"][0]) == "15% off weekend stays"
