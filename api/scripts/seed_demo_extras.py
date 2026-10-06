"""Seed demo support tickets and billing payment history on top of seed_demo_activity.

- Support tickets from app users and service providers in every status, with
  realistic back-and-forth (one shared ``support_tickets`` collection).
- Billing: every commission invoice from before last month is marked paid, plus
  one of last month's, so the Billing page shows collected and outstanding amounts.

Everything is tagged with SEED_TAG and is replaced on each run.

Runs automatically at the end of scripts.seed_demo_activity; run it alone to
refresh just these extras.

Usage (from the api/ folder):
    .venv/Scripts/python.exe -m scripts.seed_demo_extras           # (re)seed
    .venv/Scripts/python.exe -m scripts.seed_demo_extras --remove  # remove only
"""

import os
import sys
from datetime import UTC, datetime, timedelta

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

from app.core.config import get_settings
from app.domain import support_tickets
from app.modules.platform_admin import billing

SEED_TAG = "demo-extras-v1"
ACTIVITY_SEED_TAG = "demo-activity-v1"
PROVIDER_SEED_TAG = "dummy-providers-v1"

load_dotenv()
# The demo customer's email stays out of the repo (see seed_demo_activity).
DEMO = os.getenv("SEED_DEMO_EMAIL", "").strip().lower()

# (requester email, issue type, priority, status, days ago, subject, description, replies)
# replies: (who, text, hours after the previous message) where who is "agent" or "me".
USER_TICKETS = [
    (DEMO, "billing", "high", "in_progress", 2, "Charged twice for Banani Grand booking",
     "I booked a deluxe room at The Banani Grand and my card shows two charges of the same amount. Please refund the duplicate.",
     [("agent", "Sorry about that! I can see one confirmed booking on our side. Could you share the last 4 digits of the card and the time of both charges?", 3),
      ("me", "Card ending 4821, both charges at 9:42 PM on the same day.", 5)]),
    (DEMO, "technical", "low", "resolved", 21, "Map doesn't show places near me",
     "The Explore map on the home screen stays empty even though location is turned on.",
     [("agent", "Thanks for reporting. Please update to the latest version, we fixed a location permission issue on Android.", 4),
      ("me", "Updated and it works now, thanks!", 20)]),
    ("demo.customer1@nununas.test", "account", "medium", "open", 0, "Can't change my phone number",
     "When I try to update my phone number in Edit Profile it says the number is already in use, but it's my new SIM.", []),
    ("demo.customer2@nununas.test", "technical", "high", "open", 1, "App crashes when opening AI plan",
     "Every time I tap 'Plan my day' the app closes after the loading screen. Using a Samsung A54.", []),
    ("demo.customer3@nununas.test", "billing", "medium", "resolved", 12, "Spa promo code not applied",
     "I used the code RELAX20 at Lotus Wellness Spa but the total didn't change.",
     [("agent", "The code is valid for weekday bookings only, and your booking was on a Friday. We've applied the discount as a one-time courtesy.", 6),
      ("me", "That's very kind, thank you.", 10)]),
    ("demo.customer4@nununas.test", "compliance", "medium", "in_progress", 4, "Please delete my old account data",
     "I had an older account with my previous email. Please delete all data from it.",
     [("agent", "We've started the deletion request. It can take up to 7 days to complete; we'll confirm here when it's done.", 8)]),
    ("demo.customer5@nununas.test", "technical", "low", "resolved", 30, "Wrong opening hours for Lakeview Café",
     "The app says Lakeview Café is open until 11 PM but it closes at 10.",
     [("agent", "Thanks! We've asked the café to update their hours and it's now corrected.", 26)]),
    ("demo.customer6@nununas.test", "account", "high", "open", 0, "Didn't receive the verification code",
     "I'm trying to sign in on a new phone but the OTP email never arrives. Checked spam too.", []),
]

PROVIDER_TICKETS = [
    ("dummy.spicegarden@nununas.test", "billing", "high", "in_progress", 3, "Question about September commission",
     "Our September invoice shows more bookings than we had. Can you share the booking list it's based on?",
     [("agent", "Of course. The invoice counts only completed bookings from September; I'll send the list to your billing email today.", 4),
      ("me", "Got it, but booking #BK2026 was cancelled by the guest, not completed.", 18)]),
    ("dummy.lotusspa@nununas.test", "technical", "medium", "open", 1, "Can't upload new treatment photos",
     "Uploading photos in the Spa services page fails with 'upload failed' for JPGs over 3 MB.", []),
    ("dummy.bananigrand@nununas.test", "account", "low", "resolved", 15, "Add a second staff login",
     "We'd like our front desk manager to have their own login to accept bookings.",
     [("agent", "You can add team members under Profile > Team. Invites expire after 48 hours.", 5),
      ("me", "Done, thank you!", 9)]),
    ("dummy.dhakaliveevents@nununas.test", "compliance", "medium", "open", 0, "Updated trade licence",
     "Our trade licence was renewed. Where can we upload the new document so our verification stays valid?", []),
    ("dummy.fenifoodcourt@nununas.test", "billing", "medium", "resolved", 25, "Per-lead fee explanation",
     "What exactly counts as a lead for our restaurant?",
     [("agent", "A lead is a booking that was completed through the app. Cancelled or no-show bookings are not charged.", 3)]),
    ("dummy.comillaheritage@nununas.test", "technical", "high", "in_progress", 2, "Room availability not updating",
     "Rooms booked through the app still show as available on the calendar for the next day.",
     [("agent", "We reproduced this and the fix is being tested. As a workaround, block the dates manually under Rooms > Availability.", 7)]),
]


def remove_seed(db) -> int:
    removed = db[support_tickets.COLLECTION].delete_many({"seed_tag": SEED_TAG}).deleted_count
    removed += db[billing.INVOICES].delete_many({"seed_tag": SEED_TAG}).deleted_count
    return removed


def seed_tickets(db, now: datetime) -> int:
    users = {u["email"]: u for u in db.users.find({"seed_tag": ACTIVITY_SEED_TAG})}
    vendors = {v["email"]: v for v in db.vendors.find({"seed_tag": PROVIDER_SEED_TAG})}
    count = 0
    for requester_type, rows in (("user", USER_TICKETS), ("vendor", PROVIDER_TICKETS)):
        for email, issue_type, priority, status, days_ago, subject, description, replies in rows:
            if requester_type == "user":
                account = users.get(email)
                name = account and (account.get("full_name") or email)
                avatar = account and account.get("profile_image_url")
            else:
                account = vendors.get(email)
                name = account and (account.get("business_name") or "Service provider")
                avatar = account and account.get("logo_url")
            if not account:
                print(f"  skipped ticket for {email} (account not seeded)")
                continue

            opened = now - timedelta(days=days_ago, hours=2 + count % 5)
            ticket = support_tickets.new_ticket(
                requester_type=requester_type,
                requester_id=account["_id"],
                requester_name=str(name),
                requester_email=str(account.get("email") or ""),
                requester_avatar=str(avatar or ""),
                subject=subject,
                description=description,
                issue_type=issue_type,
                priority=priority,
                now=opened,
            )
            stamp = opened
            for who, text, hours_later in replies:
                stamp = min(stamp + timedelta(hours=hours_later), now - timedelta(minutes=5))
                if who == "agent":
                    ticket["messages"].append(support_tickets.new_message("agent", "Support Agent", text, stamp))
                else:
                    ticket["messages"].append(support_tickets.new_message(requester_type, str(name), text, stamp))
            if status == "resolved":
                stamp = min(stamp + timedelta(hours=1), now - timedelta(minutes=1))
                ticket["messages"].append(support_tickets.new_message("agent", "System", 'Ticket status updated to "Resolved".', stamp))
            ticket.update({"status": status, "updated_at": stamp, "seed_tag": SEED_TAG})
            db[support_tickets.COLLECTION].insert_one(ticket)
            count += 1
    return count


def seed_paid_invoices(db, now: datetime) -> tuple[int, int]:
    """Mark everything before last month paid, and the biggest of last month's invoices."""
    this_month = now.replace(day=1)
    last_month = (this_month - timedelta(days=1)).strftime("%Y-%m")
    current = this_month.strftime("%Y-%m")
    paid = 0
    for period in billing.billing_periods(db):
        if period in (current,):
            continue
        invoices = billing.build_invoices(db, period=period)
        targets = invoices if period < last_month else invoices[:1]
        for invoice in targets:
            vendor_id = ObjectId(invoice["provider"]["vendorId"])
            billing.set_invoice_status(db, vendor_id, period, "PAID", "seed")
            # Payment arrives a few days after the invoice is issued.
            paid_at = billing.period_bounds(period)[1] + timedelta(days=3 + paid % 6)
            db[billing.INVOICES].update_one(
                {"vendor_id": vendor_id, "period": period},
                {"$set": {"seed_tag": SEED_TAG, "paid_at": min(paid_at, now)}},
            )
            paid += 1
    unpaid = db[billing.INVOICES].count_documents({"status": {"$ne": "PAID"}})
    return paid, unpaid


def main() -> None:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_db_name]
        print(f"Removed {remove_seed(db)} previously seeded extras.")
        if "--remove" in sys.argv:
            return
        now = datetime.now(UTC)
        tickets = seed_tickets(db, now)
        paid, _ = seed_paid_invoices(db, now)
        print(f"Seeded {tickets} support tickets and marked {paid} commission invoices paid.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
