import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.database import Database

RESEND_COOLDOWN = timedelta(seconds=60)
FAILURE_WINDOW = timedelta(minutes=15)
MAX_FAILURES_PER_WINDOW = 10


def _as_utc(value: Any) -> datetime | None:
    if not isinstance(value, datetime):
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class AdminPasswordResetRepository:
    def __init__(self, db: Database):
        self.code_collection: Collection = db["platform_admin_password_reset_codes"]
        self.token_collection: Collection = db["platform_admin_password_reset_tokens"]
        self.code_collection.create_index("admin_id", unique=True)
        self.code_collection.create_index("expires_at", expireAfterSeconds=0)
        self.token_collection.create_index("token", unique=True)
        self.token_collection.create_index("expires_at", expireAfterSeconds=0)

    def create_validation_code(self, admin_id: str, code_length: int, expires_in_minutes: int) -> str | None:
        """Issue a new code, or return None while resends are on cooldown or guessing is locked out.

        Wrong guesses are counted per admin over FAILURE_WINDOW, not per code, so requesting
        a fresh code does not reset the limit.
        """
        now = datetime.now(UTC)
        record = self.code_collection.find_one({"admin_id": ObjectId(admin_id)})
        window_start = _as_utc(record.get("window_started_at")) if record else None
        window_active = window_start is not None and window_start > now - FAILURE_WINDOW
        if record and window_active and record.get("window_failures", 0) >= MAX_FAILURES_PER_WINDOW:
            return None
        issued_at = _as_utc(record.get("issued_at")) if record else None
        if issued_at is not None and issued_at > now - RESEND_COOLDOWN:
            return None

        if not window_active:
            window_start = now
        code_expires_at = now + timedelta(minutes=expires_in_minutes)
        max_code = 10**code_length
        code = f"{secrets.randbelow(max_code):0{code_length}d}"
        update: dict[str, Any] = {
            "code_hash": self._hash_code(admin_id, code),
            "code_expires_at": code_expires_at,
            # The document (and its failure count) lives until both the code and the window end.
            "expires_at": max(code_expires_at, window_start + FAILURE_WINDOW),
            "issued_at": now,
            "used": False,
            "attempts": 0,
            "updated_at": now,
        }
        if not window_active:
            update.update({"window_started_at": now, "window_failures": 0})
        self.code_collection.update_one(
            {"admin_id": ObjectId(admin_id)},
            {"$set": update, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        return code

    def validate_and_consume_code(self, admin_id: str, code: str, max_attempts: int = 5) -> bool:
        now = datetime.now(UTC)
        record = self.code_collection.find_one({"admin_id": ObjectId(admin_id), "used": False})
        if not record:
            return False
        code_expires_at = _as_utc(record.get("code_expires_at") or record.get("expires_at"))
        if code_expires_at is None or code_expires_at <= now:
            return False

        if (
            record.get("attempts", 0) >= max_attempts
            or record.get("window_failures", 0) >= MAX_FAILURES_PER_WINDOW
        ):
            self.code_collection.update_one(
                {"_id": record["_id"]},
                {"$set": {"used": True, "updated_at": now}},
            )
            return False

        if not secrets.compare_digest(str(record.get("code_hash") or ""), self._hash_code(admin_id, code)):
            self.code_collection.update_one(
                {"_id": record["_id"]},
                {"$inc": {"attempts": 1, "window_failures": 1}, "$set": {"updated_at": now}},
            )
            return False

        self.code_collection.update_one(
            {"_id": record["_id"]},
            {"$set": {"used": True, "updated_at": now}},
        )
        return True

    def create_reset_token(self, admin_id: str, expires_in_minutes: int) -> str:
        token = secrets.token_urlsafe(32)
        self.token_collection.insert_one(
            {
                "token": token,
                "admin_id": ObjectId(admin_id),
                "used": False,
                "expires_at": datetime.now(UTC) + timedelta(minutes=expires_in_minutes),
                "created_at": datetime.now(UTC),
            }
        )
        return token

    def get_valid_reset_token(self, token: str) -> dict[str, Any] | None:
        return self.token_collection.find_one(
            {"token": token, "used": False, "expires_at": {"$gt": datetime.now(UTC)}}
        )

    def mark_reset_token_used(self, token: str) -> None:
        self.token_collection.update_one({"token": token}, {"$set": {"used": True}})

    @staticmethod
    def _hash_code(admin_id: str, code: str) -> str:
        return hashlib.sha256(f"{admin_id}:{code}".encode("utf-8")).hexdigest()

