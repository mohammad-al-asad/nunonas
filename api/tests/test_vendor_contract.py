import pytest
from conftest import VENDOR_CONTRACT_FIELDS

from app.modules.vendor.contract import CONTRACT_VERSION


async def _signup_token(client, email: str) -> str:
    code_res = await client.post("/api/v1/vendor/auth/register/request-code", json={"email_or_phone": email})
    verify_res = await client.post(
        "/api/v1/vendor/auth/register/verify-code",
        json={"email_or_phone": email, "validation_code": code_res.json()["validation_code"]},
    )
    return verify_res.json()["signup_token"]


def _registration(email: str, signup_token: str, **overrides) -> dict:
    return {
        "business_name": "Contract Vendor",
        "owner_full_name": "Contract Owner",
        "email_or_phone": email,
        "phone": "+97455000001",
        "address": "West Bay, Doha",
        "city": "Doha",
        "business_description": "Vendor account for contract signing tests.",
        "trade_license_number": "TL-55555",
        "trade_license_document_url": "https://files.example.com/license.pdf",
        "commercial_registration_document_url": "https://files.example.com/cr.pdf",
        "terms_accepted": True,
        "password": "VendorPass123!",
        "confirm_password": "VendorPass123!",
        "signup_token": signup_token,
        **VENDOR_CONTRACT_FIELDS,
        **overrides,
    }


@pytest.mark.asyncio
async def test_contract_template_is_public(client):
    res = await client.get("/api/v1/vendor/auth/contract")
    assert res.status_code == 200
    body = res.json()
    assert body["version"] == CONTRACT_VERSION
    assert body["sections"] and body["sections"][0]["heading"]


@pytest.mark.asyncio
async def test_vendor_registration_stores_signed_contract_pdf(client, test_db, uploaded_documents):
    email = "contract-vendor@example.com"
    res = await client.post("/api/v1/vendor/auth/register", json=_registration(email, await _signup_token(client, email)))
    assert res.status_code == 201

    assert len(uploaded_documents) == 1
    upload = uploaded_documents[0]
    assert upload["content_type"] == "application/pdf"
    assert upload["folder_suffix"] == "vendor-contracts"
    assert upload["data"].startswith(b"%PDF")

    vendor = await test_db.vendors.find_one({"email": email})
    verification = await test_db.vendor_verification_details.find_one({"vendor_id": vendor["_id"]})
    assert verification["commercial_registration_document_url"] == "https://files.example.com/cr.pdf"
    assert verification["contract_pdf_url"].endswith(".pdf")
    assert verification["contract_version"] == CONTRACT_VERSION
    assert verification["contract_signer_name"] == "Contract Owner"
    assert len(verification["contract_sha256"]) == 64
    assert verification["contract_signed_at"]


@pytest.mark.asyncio
async def test_vendor_registration_rejects_missing_or_invalid_signature(client, test_db, uploaded_documents):
    email = "unsigned-vendor@example.com"
    payload = _registration(email, await _signup_token(client, email), contract_signature="data:image/png;base64,bm90LWEtcG5nLWltYWdlLWF0LWFsbA==")
    res = await client.post("/api/v1/vendor/auth/register", json=payload)
    assert res.status_code == 400
    assert uploaded_documents == []
    assert await test_db.vendors.find_one({"email": email}) is None


@pytest.mark.asyncio
async def test_vendor_registration_rejects_outdated_contract_version(client, test_db, uploaded_documents):
    email = "stale-contract@example.com"
    payload = _registration(email, await _signup_token(client, email), contract_version="old-version")
    res = await client.post("/api/v1/vendor/auth/register", json=payload)
    assert res.status_code == 409
    assert uploaded_documents == []
    assert await test_db.vendors.find_one({"email": email}) is None
