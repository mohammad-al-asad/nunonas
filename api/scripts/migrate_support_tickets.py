"""Merge service-provider tickets into the single ``support_tickets`` collection.

Moves every document from the old ``vendor_support_tickets`` collection (then
drops it) and backfills the shared requester fields on older app-user tickets.
Safe to run more than once.

Usage (from the api/ folder):
    .venv/Scripts/python.exe -m scripts.migrate_support_tickets
"""

from pymongo import MongoClient

from app.core.config import get_settings
from app.domain import support_tickets


def main() -> None:
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_db_name]
        moved = support_tickets.migrate_legacy_vendor_tickets(db)
        backfilled = support_tickets.backfill_user_tickets(db)
        support_tickets.ensure_indexes(db)
        print(f"Moved {moved} provider tickets, backfilled {backfilled} older tickets.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
