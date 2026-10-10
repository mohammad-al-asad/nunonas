"""Offer types a provider can create.

Booking discounts are applied to the booking price in the app. In-venue offers
(restaurants only) are shown with their terms and honoured at the venue, because
the app books a table rather than taking a food order.
"""

from typing import Any

BOOKING_TYPES = ("percentage", "fixed_amount")
VENUE_TYPES = ("bogo", "food_percentage", "menu_percentage", "custom")
OFFER_TYPE_PATTERN = f"^({'|'.join(BOOKING_TYPES + VENUE_TYPES)})$"
VENUE_APPLICABLE_TO = "Dining Only"


def is_booking_discount(promotion: dict[str, Any]) -> bool:
    return str(promotion.get("offer_type") or "percentage").lower() in BOOKING_TYPES


def normalize(promotion: dict[str, Any]) -> dict[str, Any]:
    """Validate type-specific fields and return the fields to store. Raises ValueError."""
    offer_type = str(promotion.get("offer_type") or "percentage").lower()
    value = float(promotion.get("discount_value") or 0)
    terms = str(promotion.get("terms") or "").strip()
    if offer_type in ("percentage", "food_percentage", "menu_percentage") and not 0 < value <= 100:
        raise ValueError("Percentage discounts must be between 1 and 100.")
    if offer_type == "fixed_amount" and value <= 0:
        raise ValueError("The discount amount must be above 0.")
    if offer_type in ("bogo", "custom") and not terms:
        raise ValueError("Describe the offer terms so customers know what they get.")
    fields: dict[str, Any] = {"offer_type": offer_type, "terms": terms}
    if offer_type in VENUE_TYPES:
        fields.update(
            {
                "discount_value": value if offer_type in ("food_percentage", "menu_percentage") else 0.0,
                "applicable_to": VENUE_APPLICABLE_TO,
                "require_promo_code": False,
                "promo_code": None,
                "minimum_spend": None,
                "first_time_customers_only": False,
            }
        )
    return fields


def label(promotion: dict[str, Any]) -> str:
    offer_type = str(promotion.get("offer_type") or "percentage").lower()
    value = float(promotion.get("discount_value") or 0)
    if offer_type == "percentage":
        return f"{value:g}% off your booking"
    if offer_type == "fixed_amount":
        return f"{value:g} off your booking"
    if offer_type == "food_percentage":
        return f"{value:g}% off food"
    if offer_type == "menu_percentage":
        return f"{value:g}% off the entire menu"
    if offer_type == "bogo":
        return "Buy one, get one free"
    return str(promotion.get("promotion_name") or "Special offer")
