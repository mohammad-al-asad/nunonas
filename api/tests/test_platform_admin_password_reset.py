from datetime import UTC, datetime, timedelta

import mongomock
import pytest
from fastapi import HTTPException

from app.core.security import hash_password, verify_password
from app.core.session_tokens import SESSION_COLLECTION, build_session_document
from app.modules.platform_admin import repositories_password_reset as reset_module
from app.modules.platform_admin.repositories_admin import PlatformAdminRepository
from app.modules.platform_admin.repositories_password_reset import AdminPasswordResetRepository
from app.modules.platform_admin.repositories_signup import AdminSignupVerificationRepository
from app.modules.platform_admin.schemas_auth import (
    AdminForgotPasswordRequest,
    AdminResetPasswordRequest,
    AdminVerifyResetCodeRequest,
)
from app.modules.platform_admin.service_auth import RESET_CODE_SENT, PlatformAdminAuthService

ADMIN_EMAIL = "admin@example.com"


class FakeEmailSender:
    def __init__(self, fail: bool = False):
        self.fail = fail
        self.codes: list[str] = []

    def send_signup_verification_code(self, **kwargs) -> None:
        self.codes.append(kwargs["code"])

    def send_password_reset_code(self, **kwargs) -> None:
        if self.fail:
            raise HTTPException(status_code=500, detail="Failed to send reset code email.")
        self.codes.append(kwargs["code"])


@pytest.fixture
def db():
    return mongomock.MongoClient()["admin_reset_test"]


@pytest.fixture
def admin_id(db) -> str:
    return PlatformAdminRepository(db).create_admin(
        {"email": ADMIN_EMAIL, "full_name": "Admin", "role": "platform_admin", "password_hash": hash_password("OldPass123!")}
    )["id"]


def _service(db, sender: FakeEmailSender) -> PlatformAdminAuthService:
    return PlatformAdminAuthService(
        admin_repo=PlatformAdminRepository(db),
        signup_repo=AdminSignupVerificationRepository(db),
        password_reset_repo=AdminPasswordResetRepository(db),
        email_sender=sender,
    )


def _request(service, email=ADMIN_EMAIL):
    return service.request_forgot_password_code(AdminForgotPasswordRequest(email_or_phone=email))


def _verify(service, code):
    return service.verify_forgot_password_code(
        AdminVerifyResetCodeRequest(email_or_phone=ADMIN_EMAIL, validation_code=code)
    )


def _wrong(code: str) -> str:
    return "000000" if code != "000000" else "111111"


def _expire_cooldown(db) -> None:
    db["platform_admin_password_reset_codes"].update_many(
        {}, {"$set": {"issued_at": datetime.now(UTC) - reset_module.RESEND_COOLDOWN - timedelta(seconds=1)}}
    )


def test_full_reset_flow_emails_code_changes_password_and_signs_out_sessions(db, admin_id):
    sender = FakeEmailSender()
    service = _service(db, sender)
    db[SESSION_COLLECTION].insert_one(
        build_session_document(subject_id=admin_id, audience="platform_admin", role="platform_admin")
    )

    assert _request(service).message in {RESET_CODE_SENT, "Validation code sent (debug mode includes code)."}
    assert len(sender.codes) == 1

    reset_token = _verify(service, sender.codes[0]).reset_token
    service.reset_password(
        AdminResetPasswordRequest(reset_token=reset_token, new_password="NewPass123!", confirm_password="NewPass123!")
    )

    admin = PlatformAdminRepository(db).get_by_id(admin_id)
    assert verify_password("NewPass123!", admin["password_hash"])
    assert db[SESSION_COLLECTION].count_documents({"subject_id": admin_id, "revoked_at": None}) == 0
    with pytest.raises(HTTPException):  # reset tokens are single use
        service.reset_password(
            AdminResetPasswordRequest(reset_token=reset_token, new_password="Other123!", confirm_password="Other123!")
        )


def test_unknown_email_and_failed_email_get_the_same_reply(db, admin_id):
    assert _request(_service(db, FakeEmailSender()), "nobody@example.com").message == RESET_CODE_SENT
    assert _request(_service(db, FakeEmailSender(fail=True))).message == RESET_CODE_SENT


def test_resend_has_a_cooldown(db, admin_id):
    sender = FakeEmailSender()
    service = _service(db, sender)
    _request(service)
    _request(service)
    assert len(sender.codes) == 1

    _expire_cooldown(db)
    _request(service)
    assert len(sender.codes) == 2


def test_new_codes_do_not_reset_the_guess_limit(db, admin_id):
    sender = FakeEmailSender()
    service = _service(db, sender)
    for _ in range(reset_module.MAX_FAILURES_PER_WINDOW // 5):
        _request(service)
        for _ in range(5):
            with pytest.raises(HTTPException):
                _verify(service, _wrong(sender.codes[-1]))
        _expire_cooldown(db)

    sent = len(sender.codes)
    _request(service)
    assert len(sender.codes) == sent  # locked out: no new code is sent
    with pytest.raises(HTTPException):
        _verify(service, sender.codes[-1])
