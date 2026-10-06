from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pymongo.database import Database

from app.modules.platform_admin import billing
from app.modules.platform_admin.deps import get_platform_admin_db
from app.modules.platform_admin.deps_auth import get_current_platform_admin

router = APIRouter(
    prefix="/platform-admin/billing",
    tags=["Platform Admin - Billing"],
    dependencies=[Depends(get_current_platform_admin)],
)


def _period_or_400(period: str | None) -> str:
    if period is None:
        return billing.current_period()
    valid = billing.valid_period(period)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Period must look like YYYY-MM.")
    return valid


def _vendor_oid(vendor_id: str) -> ObjectId:
    try:
        return ObjectId(vendor_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service provider id.")


@router.get("/overview")
def get_billing_overview(
    period: str | None = Query(default=None, description="Billing month, YYYY-MM. Defaults to the current month."),
    db: Database = Depends(get_platform_admin_db),
) -> dict:
    billing.ensure_indexes(db)
    return billing.overview(db, _period_or_400(period))


@router.get("/commission-rates")
def get_commission_rates(db: Database = Depends(get_platform_admin_db)) -> dict:
    return billing.rates_payload(db)


@router.put("/commission-rates")
def update_commission_rates(
    payload: dict = Body(...),
    db: Database = Depends(get_platform_admin_db),
    admin: dict = Depends(get_current_platform_admin),
) -> dict:
    raw = payload.get("categories")
    if isinstance(raw, list):
        raw = {str(item.get("key")): item for item in raw if isinstance(item, dict)}
    try:
        billing.save_rates(db, raw, changed_by=str(admin.get("id") or ""))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return billing.rates_payload(db)


@router.get("/providers/{vendor_id}/invoices")
def list_provider_invoices(vendor_id: str, db: Database = Depends(get_platform_admin_db)) -> dict:
    return {"invoices": billing.build_invoices(db, vendor_id=_vendor_oid(vendor_id))}


@router.post("/providers/{vendor_id}/invoices/{period}/status")
def update_invoice_status(
    vendor_id: str,
    period: str,
    payload: dict = Body(...),
    db: Database = Depends(get_platform_admin_db),
    admin: dict = Depends(get_current_platform_admin),
) -> dict:
    next_status = str(payload.get("status") or "").upper()
    if next_status not in {"PAID", "UNPAID"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be PAID or UNPAID.")
    invoice = billing.set_invoice_status(
        db, _vendor_oid(vendor_id), _period_or_400(period), next_status, str(admin.get("id") or "")
    )
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice for this provider and month.")
    return {"invoice": invoice}


@router.post("/providers/{vendor_id}/invoices/{period}/reminder")
def record_invoice_reminder(vendor_id: str, period: str, db: Database = Depends(get_platform_admin_db)) -> dict:
    invoice = billing.record_reminder(db, _vendor_oid(vendor_id), _period_or_400(period))
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice for this provider and month.")
    return {"invoice": invoice}
