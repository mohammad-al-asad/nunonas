"""Customer demographics shared by the provider and platform-admin dashboards."""

from collections.abc import Iterable
from datetime import date, datetime
from typing import Any

GENDERS = ("female", "male", "other", "unknown")
AGE_GROUPS = ("under_18", "18_24", "25_34", "35_44", "45_54", "55_plus", "unknown")


def parse_birth_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return date.fromisoformat(value.strip()[:10])
        except ValueError:
            return None
    return None


def age_on(birth_date: date | None, today: date) -> int | None:
    if birth_date is None:
        return None
    years = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    return years if 0 <= years < 120 else None


def age_group(age: int | None) -> str:
    if age is None:
        return "unknown"
    if age < 18:
        return "under_18"
    if age < 25:
        return "18_24"
    if age < 35:
        return "25_34"
    if age < 45:
        return "35_44"
    if age < 55:
        return "45_54"
    return "55_plus"


def normalize_gender(value: Any) -> str:
    gender = str(value or "").strip().lower()
    if gender in {"female", "f", "woman"}:
        return "female"
    if gender in {"male", "m", "man"}:
        return "male"
    if gender:
        return "other"
    return "unknown"


def summarize(customers: Iterable[dict[str, Any]], today: date) -> dict[str, Any]:
    """Count customers by gender and age group.

    Each customer is a dict with optional ``gender`` and ``date_of_birth``.
    """
    gender_counts = dict.fromkeys(GENDERS, 0)
    age_counts = dict.fromkeys(AGE_GROUPS, 0)
    total = 0
    for customer in customers:
        total += 1
        gender_counts[normalize_gender(customer.get("gender"))] += 1
        age = age_on(parse_birth_date(customer.get("date_of_birth")), today)
        age_counts[age_group(age)] += 1
    return {
        "total_customers": total,
        "gender": [{"key": key, "count": gender_counts[key]} for key in GENDERS],
        "age_groups": [{"key": key, "count": age_counts[key]} for key in AGE_GROUPS],
    }
