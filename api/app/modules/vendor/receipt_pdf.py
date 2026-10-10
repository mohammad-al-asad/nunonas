"""Booking receipt PDF that a service provider can print or send to the customer."""

from datetime import datetime
from typing import Any

from fpdf import FPDF

from app.modules.vendor.contract import PLATFORM_NAME, _latin1

TEXT = (30, 41, 59)
MUTED = (100, 116, 139)
RULE = (226, 232, 240)
ACCENT = (14, 165, 233)
ROW_HEIGHT = 8


def _money(amount: float) -> str:
    return f"{'-' if amount < 0 else ''}${abs(amount):,.2f}"


def render_receipt_pdf(receipt: dict[str, Any], business: dict[str, str], issued_at: datetime) -> bytes:
    """Render the receipt built by VendorPortalRepository.generate_receipt as PDF bytes."""
    pdf = FPDF(format=(148, 210))  # A5 in mm
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(14, 14, 14)
    pdf.add_page()
    width = pdf.w - pdf.l_margin - pdf.r_margin

    # Business name and contact details.
    pdf.set_text_color(*TEXT)
    pdf.set_font("Helvetica", style="B", size=15)
    pdf.multi_cell(0, 7, _latin1(business.get("name") or "Booking receipt"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=8.5)
    pdf.set_text_color(*MUTED)
    for line in (business.get("address"), business.get("contact")):
        if line:
            pdf.multi_cell(0, 4.5, _latin1(line), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)
    pdf.set_font("Helvetica", style="B", size=11)
    pdf.set_text_color(*ACCENT)
    pdf.cell(width / 2, 6, "BOOKING RECEIPT")
    pdf.set_font("Helvetica", size=8.5)
    pdf.set_text_color(*MUTED)
    pdf.cell(width / 2, 6, _latin1(f"Issued {issued_at.strftime('%d %b %Y')}"), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*RULE)
    pdf.line(pdf.l_margin, pdf.get_y() + 1, pdf.w - pdf.r_margin, pdf.get_y() + 1)
    pdf.ln(4)

    def row(label: str, value: str, *, bold: bool = False, size: float = 9.5) -> None:
        pdf.set_font("Helvetica", size=size)
        pdf.set_text_color(*MUTED)
        pdf.cell(width * 0.4, ROW_HEIGHT, _latin1(label))
        pdf.set_font("Helvetica", style="B" if bold else "", size=size)
        pdf.set_text_color(*TEXT)
        pdf.cell(width * 0.6, ROW_HEIGHT, _latin1(value), align="R", new_x="LMARGIN", new_y="NEXT")

    def rule() -> None:
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())

    # Hotel stays show the room and stay dates instead of a single date and time.
    is_stay = bool(receipt.get("check_in_date") and receipt.get("check_out_date"))
    fields = (
        (
            ("Booking", "booking_code"),
            ("Guest", "customer_name"),
            ("Room", "room_type"),
            ("Check-in", "check_in_date"),
            ("Check-out", "check_out_date"),
            ("Nights", "nights"),
            ("Guests", "guests"),
        )
        if is_stay
        else (
            ("Booking", "booking_code"),
            ("Customer", "customer_name"),
            ("Service", "service"),
            ("Date", "scheduled_date"),
            ("Time", "scheduled_time"),
            ("Guests", "guests"),
        )
    )
    for label, key in fields:
        value = receipt.get(key)
        if value not in (None, ""):
            row(label, str(value))
    rate = receipt.get("rate_per_night")
    if is_stay and rate not in (None, ""):
        row("Rate per night", _money(float(rate)))

    pdf.ln(2)
    rule()
    pdf.ln(2)
    row("Subtotal", _money(float(receipt.get("subtotal") or 0)))
    for item in receipt.get("line_items") or []:
        row(str(item["label"]), _money(float(item["amount"])))
    pdf.ln(1)
    rule()
    pdf.ln(1)
    row("Total", _money(float(receipt.get("total") or 0)), bold=True, size=12)
    row("Payment", "Paid" if receipt.get("payment_status") == "paid" else "Pay at venue")

    pdf.ln(8)
    pdf.set_font("Helvetica", size=8)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 4.5, _latin1(f"Booked through {PLATFORM_NAME}. Thank you for your visit!"), align="C", new_x="LMARGIN", new_y="NEXT")
    return bytes(pdf.output())
