from datetime import date, datetime

from app.domain import demographics


def counts(rows):
    return {row["key"]: row["count"] for row in rows}


def test_age_group_boundaries():
    today = date(2026, 10, 9)
    assert demographics.age_group(demographics.age_on(date(2008, 10, 10), today)) == "under_18"
    assert demographics.age_group(demographics.age_on(date(2008, 10, 9), today)) == "18_24"
    assert demographics.age_group(demographics.age_on(date(1991, 10, 9), today)) == "35_44"
    assert demographics.age_group(demographics.age_on(date(1950, 1, 1), today)) == "55_plus"
    assert demographics.age_group(None) == "unknown"


def test_summarize_counts_gender_and_age_with_missing_values():
    summary = demographics.summarize(
        [
            {"gender": "Female", "date_of_birth": "1999-06-14"},
            {"gender": "male", "date_of_birth": datetime(1983, 8, 9)},
            {"gender": "non-binary"},
            {"date_of_birth": "not a date"},
        ],
        date(2026, 10, 9),
    )

    assert summary["total_customers"] == 4
    assert counts(summary["gender"]) == {"female": 1, "male": 1, "other": 1, "unknown": 1}
    ages = counts(summary["age_groups"])
    assert ages["25_34"] == 1
    assert ages["35_44"] == 1
    assert ages["unknown"] == 2
