import base64
import io

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient
from PIL import Image

from app.ai.client import StubLLMClient
from app.api.deps import get_ai_service, get_email_sender
from app.core.config import Settings, get_settings
from app.db.mongo import get_database
from app.main import create_app
from app.modules.customer.deps import get_db as get_customer_db
from app.modules.platform_admin.deps_auth import get_platform_admin_db
from app.modules.vendor.contract import CONTRACT_VERSION
from app.modules.vendor.deps_auth import get_vendor_db
from app.providers.cloudinary_uploader import CloudinaryUploader
from app.repositories.listing_repository import ListingRepository
from app.services.ai_service import AIPlannerService


def _signature_data_url() -> str:
    buffer = io.BytesIO()
    Image.new("RGBA", (40, 20), (20, 30, 80, 255)).save(buffer, "PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()


VENDOR_CONTRACT_FIELDS = {
    "contract_signature": _signature_data_url(),
    "contract_version": CONTRACT_VERSION,
}


@pytest.fixture
def uploaded_documents(monkeypatch):
    """Capture generated uploads (e.g. signed contract PDFs) instead of calling Cloudinary."""
    uploads: list[dict] = []

    async def fake_upload_document_bytes(self, data, *, filename, content_type, folder_suffix="vendor-documents"):
        uploads.append({"data": data, "filename": filename, "content_type": content_type, "folder_suffix": folder_suffix})
        return f"https://files.example.com/{folder_suffix}/{filename}"

    monkeypatch.setattr(CloudinaryUploader, "upload_document_bytes", fake_upload_document_bytes)
    return uploads


@pytest.fixture
def test_db():
    client = AsyncMongoMockClient()
    return client["nuno_test"]


@pytest.fixture
def app(test_db, uploaded_documents):
    application = create_app(disable_startup_db=True)

    async def _override_get_db():
        return test_db

    class FakeEmailSender:
        def send_signup_verification_code(self, recipient_email: str, full_name: str, code: str, expires_in: int) -> None:
            return None

        def send_password_reset_code(self, recipient_email: str, full_name: str, code: str, expires_in: int) -> None:
            return None

    test_settings = Settings(
        jwt_secret_key="test-secret-key-123",
        debug_return_signup_code=True,
        debug_return_reset_code=True,
    )

    class FakeCustomerMongoDatabase:
        def __init__(self, db):
            self.db = db

    application.dependency_overrides[get_database] = _override_get_db
    application.dependency_overrides[get_email_sender] = lambda: FakeEmailSender()
    application.dependency_overrides[get_settings] = lambda: test_settings
    application.dependency_overrides[get_customer_db] = lambda: FakeCustomerMongoDatabase(
        test_db._AsyncMongoMockDatabase__database
    )
    application.dependency_overrides[get_vendor_db] = lambda: test_db._AsyncMongoMockDatabase__database
    application.dependency_overrides[get_platform_admin_db] = lambda: test_db._AsyncMongoMockDatabase__database
    application.dependency_overrides[get_ai_service] = lambda: AIPlannerService(ListingRepository(test_db), StubLLMClient())
    return application


@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
