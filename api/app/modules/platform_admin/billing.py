"""Platform commission billing.

How the platform earns money:
- Each provider category (restaurant, hotel, spa, event) has a commission rule:
  either a percentage of the booking subtotal, or a flat fee per lead.
- Only completed bookings are billable. A completed booking is one "lead".
- Every rate change is stored with the moment it took effect, and a booking is
  billed with the rule that was active when the booking was made.
- Providers get one invoice per calendar month, grouped by the month the
  booking was completed. The invoice total is what the provider owes the
  platform. Paid invoices are frozen; marking one unpaid recalculates it.
"""

from __future__ import annotations

from calendar import monthrange
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database

CATEGORIES: dict[str, str] = {"restaurant": "Restaurant", "hotel": "Hotel", "spa": "Spa", "event": "Event"}
MODELS = {"percentage", "per_lead"}
COMPLETED_STATUSES = ["complete", "completed"]
DEFAULT_PERCENTAGE = 12.5
PAYMENT_DUE_DAYS = 15

SETTINGS_DOC_ID = "platform_admin_settings"
RATE_HISTORY = "commission_rate_history"
INVOICES = "billing_invoices"


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def _aware(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    return None


def _number(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _money(value: float) -> float:
    return round(value + 1e-9, 2)


def normalize_category(value: Any) -> str | None:
    text = str(value or "").strip().lower()
    if text in {"hotel_room", "room", "rooms", "hotels"}:
        return "hotel"
    if text in {"restaurants", "dining"}:
        return "restaurant"
    if text in {"spas", "wellness"}:
        return "spa"
    if text in {"events", "vendor_event"}:
        return "event"
    return text if text in CATEGORIES else None


def valid_period(period: str | None) -> str | None:
    try:
        datetime.strptime(str(period or ""), "%Y-%m")
    except ValueError:
        return None
    return str(period)


def current_period(now: datetime | None = None) -> str:
    return (now or datetime.now(UTC)).strftime("%Y-%m")


def period_bounds(period: str) -> tuple[datetime, datetime]:
    start = datetime.strptime(period, "%Y-%m").replace(tzinfo=UTC)
    last_day = monthrange(start.year, start.month)[1]
    return start, start.replace(day=last_day, hour=23, minute=59, second=59)


def period_label(period: str) -> str:
    return datetime.strptime(period, "%Y-%m").strftime("%B %Y")


def due_date(period: str) -> datetime:
    _, end = period_bounds(period)
    return (end + timedelta(days=PAYMENT_DUE_DAYS)).replace(hour=0, minute=0, second=0)


# ---------------------------------------------------------------------------
# Commission rates (versioned)
# ---------------------------------------------------------------------------

def _legacy_percentage(db: Database) -> float:
    settings = db["platform_admin_settings"].find_one({"_id": SETTINGS_DOC_ID}, {"commission": 1}) or {}
    commission = settings.get("commission") if isinstance(settings.get("commission"), dict) else {}
    rate = _number(commission.get("globalRate"))
    return rate if 0 < rate <= 100 else DEFAULT_PERCENTAGE


def _clean_rules(raw: Any, fallback: dict[str, dict] | None = None) -> dict[str, dict]:
    raw = raw if isinstance(raw, dict) else {}
    rules: dict[str, dict] = {}
    for key in CATEGORIES:
        entry = raw.get(key) if isinstance(raw.get(key), dict) else (fallback or {}).get(key, {})
        model = entry.get("model") if entry.get("model") in MODELS else "percentage"
        rules[key] = {"model": model, "value": _money(max(_number(entry.get("value")), 0))}
    return rules


def ensure_rate_history(db: Database) -> None:
    """Create the initial rate version (the old global % for every category) if none exists."""
    history = db[RATE_HISTORY]
    if history.estimated_document_count() > 0:
        return
    history.create_index([("effective_from", ASCENDING)])
    rate = _legacy_percentage(db)
    history.insert_one(
        {
            "effective_from": datetime(2000, 1, 1, tzinfo=UTC),
            "categories": {key: {"model": "percentage", "value": rate} for key in CATEGORIES},
            "created_at": datetime.now(UTC),
            "note": "Initial rates (previous global commission)",
        }
    )


def rate_versions(db: Database) -> list[dict]:
    ensure_rate_history(db)
    return list(db[RATE_HISTORY].find({}).sort("effective_from", ASCENDING))


def current_rates(db: Database) -> dict[str, dict]:
    versions = rate_versions(db)
    return _clean_rules(versions[-1].get("categories"))


def rule_for(versions: list[dict], category: str, at: datetime | None) -> dict:
    """The rule for a category that was active at `at` (falls back to the oldest version)."""
    chosen = versions[0]
    if at is not None:
        for version in versions:
            effective = _aware(version.get("effective_from"))
            if effective is not None and effective <= at:
                chosen = version
            else:
                break
    return _clean_rules(chosen.get("categories"))[category]


def save_rates(db: Database, raw: Any, changed_by: str | None = None) -> dict[str, dict]:
    previous = current_rates(db)
    rules = _clean_rules(raw, previous)
    for key, rule in rules.items():
        if rule["model"] == "percentage" and rule["value"] > 100:
            raise ValueError(f"{CATEGORIES[key]} commission can't be more than 100%.")
    if rules != previous:
        db[RATE_HISTORY].insert_one(
            {
                "effective_from": datetime.now(UTC),
                "categories": rules,
                "created_at": datetime.now(UTC),
                "changed_by": changed_by,
            }
        )
    return rules


def rates_payload(db: Database) -> dict:
    versions = rate_versions(db)
    rules = _clean_rules(versions[-1].get("categories"))
    return {
        "categories": [
            {"key": key, "label": label, **rules[key]} for key, label in CATEGORIES.items()
        ],
        "effectiveFrom": _aware(versions[-1].get("effective_from")).isoformat() if len(versions) > 1 else None,
    }


def describe_rule(rule: dict) -> str:
    value = rule["value"]
    if rule["model"] == "per_lead":
        return f"${value:,.2f} per lead"
    return f"{value:g}% of booking value"


# ---------------------------------------------------------------------------
# Business details (the platform, shown as the invoice sender)
# ---------------------------------------------------------------------------

def business_details(db: Database) -> dict:
    settings = db["platform_admin_settings"].find_one({"_id": SETTINGS_DOC_ID}, {"general": 1}) or {}
    general = settings.get("general") if isinstance(settings.get("general"), dict) else {}
    info = general.get("businessInfo") if isinstance(general.get("businessInfo"), dict) else {}
    admin = db["platform_admins"].find_one({}, {"email": 1}) or {}
    return {
        "name": str(info.get("name") or "Activity Planner").strip(),
        "address": str(info.get("address") or "").strip(),
        "email": str(info.get("email") or general.get("supportEmail") or admin.get("email") or "").strip(),
        "phone": str(info.get("phone") or "").strip(),
    }


# ---------------------------------------------------------------------------
# Billable bookings and invoices
# ---------------------------------------------------------------------------

def _completed_at(booking: dict) -> datetime | None:
    completed = _aware(booking.get("completed_at"))
    if completed:
        return completed
    for entry in reversed(booking.get("status_history") or []):
        if isinstance(entry, dict) and str(entry.get("status") or "").lower() in COMPLETED_STATUSES:
            stamp = _aware(entry.get("at"))
            if stamp:
                return stamp
    return _aware(booking.get("updated_at")) or _aware(booking.get("created_at"))


def _booking_value(booking: dict) -> float:
    """What the provider earned: subtotal after discounts, before the app's service fee and taxes."""
    if booking.get("subtotal") is not None:
        return max(_number(booking.get("subtotal")), 0)
    return max(_number(booking.get("total_amount")) - _number(booking.get("service_fee")) - _number(booking.get("taxes")), 0)


def _billable_bookings(db: Database, vendor_ids: list[ObjectId] | None = None) -> list[dict]:
    query: dict[str, Any] = {"status": {"$in": COMPLETED_STATUSES}}
    if vendor_ids is not None:
        query["vendor_id"] = {"$in": vendor_ids}
    projection = {
        "vendor_id": 1, "provider_type": 1, "subtotal": 1, "total_amount": 1, "service_fee": 1, "taxes": 1,
        "created_at": 1, "requested_at": 1, "completed_at": 1, "updated_at": 1, "status_history": 1, "booking_code": 1,
    }
    rows = []
    for booking in db["vendor_bookings"].find(query, projection):
        completed = _completed_at(booking)
        if not completed or not isinstance(booking.get("vendor_id"), ObjectId):
            continue
        rows.append(
            {
                "vendor_id": booking["vendor_id"],
                "category": normalize_category(booking.get("provider_type")),
                "value": _booking_value(booking),
                "booked_at": _aware(booking.get("created_at")) or _aware(booking.get("requested_at")) or completed,
                "period": completed.strftime("%Y-%m"),
            }
        )
    return rows


def _vendor_category(vendor: dict) -> str | None:
    categories = vendor.get("categories") if isinstance(vendor.get("categories"), list) else []
    for value in [vendor.get("category"), *categories]:
        category = normalize_category(value)
        if category:
            return category
    return None


def _compute_invoice(bookings: list[dict], versions: list[dict], vendor: dict) -> dict:
    """Commission lines for one provider's bookings in one month."""
    fallback_category = _vendor_category(vendor) or "restaurant"
    lines: dict[tuple, dict] = {}
    for booking in bookings:
        category = booking["category"] or fallback_category
        rule = rule_for(versions, category, booking["booked_at"])
        key = (category, rule["model"], rule["value"])
        line = lines.setdefault(
            key,
            {"category": category, "label": CATEGORIES[category], "model": rule["model"], "rate": rule["value"],
             "bookings": 0, "bookingValue": 0.0, "commission": 0.0},
        )
        line["bookings"] += 1
        line["bookingValue"] += booking["value"]
        line["commission"] += booking["value"] * rule["value"] / 100 if rule["model"] == "percentage" else rule["value"]

    ordered = sorted(lines.values(), key=lambda item: (item["label"], item["model"], item["rate"]))
    for line in ordered:
        line["bookingValue"] = _money(line["bookingValue"])
        line["commission"] = _money(line["commission"])
        line["description"] = (
            f"{line['label']} bookings - {line['rate']:g}% commission"
            if line["model"] == "percentage"
            else f"{line['label']} leads - ${line['rate']:,.2f} per lead"
        )
    return {
        "lines": ordered,
        "bookings": sum(line["bookings"] for line in ordered),
        "bookingValue": _money(sum(line["bookingValue"] for line in ordered)),
        "amountDue": _money(sum(line["commission"] for line in ordered)),
    }


def _vendor_profile(vendor: dict) -> dict:
    vendor_id = str(vendor["_id"])
    name = vendor.get("business_name") or vendor.get("owner_full_name") or "Service provider"
    category = _vendor_category(vendor)
    created = _aware(vendor.get("created_at"))
    return {
        "vendorId": vendor_id,
        "vendorCode": vendor.get("vendor_code") or vendor_id[-6:].upper(),
        "name": name,
        "owner": vendor.get("owner_full_name") or "",
        "email": vendor.get("email") or "",
        "phone": vendor.get("phone") or vendor.get("phone_number") or "",
        "address": vendor.get("address") or vendor.get("business_address") or "",
        "category": CATEGORIES.get(category or "", "Service provider"),
        "joinedDate": created.strftime("%b %d, %Y") if created else "",
        "image": vendor.get("logo_url") or "",
    }


def _invoice_number(profile: dict, period: str) -> str:
    return f"INV-{period.replace('-', '')}-{profile['vendorCode']}"


def _status_fields(record: dict | None, period: str, now: datetime) -> dict:
    status = "PAID" if record and record.get("status") == "PAID" else "UNPAID"
    due = due_date(period)
    paid_at = _aware((record or {}).get("paid_at"))
    reminder = _aware((record or {}).get("reminder_sent_at"))
    return {
        "status": status,
        "overdue": status == "UNPAID" and now > due,
        "dueDate": due.date().isoformat(),
        "paidAt": paid_at.isoformat() if paid_at else None,
        "reminderSentAt": reminder.isoformat() if reminder else None,
    }


def build_invoices(db: Database, *, period: str | None = None, vendor_id: ObjectId | None = None) -> list[dict]:
    """Invoices for one month (all providers) or for one provider (all months)."""
    versions = rate_versions(db)
    vendor_filter = [vendor_id] if vendor_id else None
    bookings = [b for b in _billable_bookings(db, vendor_filter) if period is None or b["period"] == period]

    grouped: dict[tuple[ObjectId, str], list[dict]] = {}
    for booking in bookings:
        grouped.setdefault((booking["vendor_id"], booking["period"]), []).append(booking)

    record_query: dict[str, Any] = {}
    if period:
        record_query["period"] = period
    if vendor_id:
        record_query["vendor_id"] = vendor_id
    records = {(r["vendor_id"], r["period"]): r for r in db[INVOICES].find(record_query)}
    # Paid invoices stay visible even if their bookings later changed.
    for key, record in records.items():
        if record.get("status") == "PAID" and key not in grouped:
            grouped[key] = []

    vendor_ids = list({key[0] for key in grouped})
    vendors = {v["_id"]: v for v in db["vendors"].find({"_id": {"$in": vendor_ids}})}
    now = datetime.now(UTC)
    invoices = []
    for (vid, month), rows in grouped.items():
        vendor = vendors.get(vid)
        if not vendor:
            continue
        record = records.get((vid, month))
        frozen = record.get("snapshot") if record and record.get("status") == "PAID" else None
        totals = frozen if isinstance(frozen, dict) else _compute_invoice(rows, versions, vendor)
        if not totals["bookings"] and not frozen:
            continue
        profile = _vendor_profile(vendor)
        invoices.append(
            {
                "id": f"{profile['vendorId']}:{month}",
                "invoiceNumber": _invoice_number(profile, month),
                "period": month,
                "periodLabel": period_label(month),
                "provider": profile,
                **totals,
                **_status_fields(record, month, now),
            }
        )
    invoices.sort(key=lambda item: (item["period"], item["amountDue"]), reverse=True)
    return invoices


def billing_periods(db: Database) -> list[str]:
    months = {b["period"] for b in _billable_bookings(db)}
    months.update(r["period"] for r in db[INVOICES].find({}, {"period": 1}) if r.get("period"))
    months.add(current_period())
    return sorted(months, reverse=True)


def set_invoice_status(db: Database, vendor_id: ObjectId, period: str, status: str, admin_id: str | None) -> dict | None:
    current = next(iter(build_invoices(db, period=period, vendor_id=vendor_id)), None)
    if not current:
        return None
    now = datetime.now(UTC)
    update: dict[str, Any] = {"status": status, "updated_at": now}
    unset: dict[str, Any] = {}
    if status == "PAID":
        update["paid_at"] = now
        update["snapshot"] = {key: current[key] for key in ("lines", "bookings", "bookingValue", "amountDue")}
    else:
        unset = {"paid_at": "", "snapshot": ""}
    operation: dict[str, Any] = {
        "$set": update,
        "$setOnInsert": {"created_at": now},
        "$push": {"status_log": {"status": status, "at": now, "by": admin_id}},
    }
    if unset:
        operation["$unset"] = unset
    db[INVOICES].update_one({"vendor_id": vendor_id, "period": period}, operation, upsert=True)
    return next(iter(build_invoices(db, period=period, vendor_id=vendor_id)), None)


def record_reminder(db: Database, vendor_id: ObjectId, period: str) -> dict | None:
    now = datetime.now(UTC)
    db[INVOICES].update_one(
        {"vendor_id": vendor_id, "period": period},
        {"$set": {"reminder_sent_at": now, "updated_at": now}, "$setOnInsert": {"status": "UNPAID", "created_at": now}},
        upsert=True,
    )
    return next(iter(build_invoices(db, period=period, vendor_id=vendor_id)), None)


def outstanding_for_vendor(db: Database, vendor_id: ObjectId) -> float:
    return _money(sum(inv["amountDue"] for inv in build_invoices(db, vendor_id=vendor_id) if inv["status"] == "UNPAID"))


def overview(db: Database, period: str) -> dict:
    invoices = build_invoices(db, period=period)
    paid = [inv for inv in invoices if inv["status"] == "PAID"]
    unpaid = [inv for inv in invoices if inv["status"] == "UNPAID"]
    return {
        "period": period,
        "periodLabel": period_label(period),
        "periods": [{"value": value, "label": period_label(value)} for value in billing_periods(db)],
        "summary": {
            "bookingValue": _money(sum(inv["bookingValue"] for inv in invoices)),
            "completedBookings": sum(inv["bookings"] for inv in invoices),
            "commissionDue": _money(sum(inv["amountDue"] for inv in invoices)),
            "collected": _money(sum(inv["amountDue"] for inv in paid)),
            "outstanding": _money(sum(inv["amountDue"] for inv in unpaid)),
            "unpaidInvoices": len(unpaid),
            "providers": len(invoices),
        },
        "invoices": invoices,
        "rates": rates_payload(db),
        "business": business_details(db),
    }


def ensure_indexes(db: Database) -> None:
    db[INVOICES].create_index([("vendor_id", ASCENDING), ("period", DESCENDING)], unique=True)
