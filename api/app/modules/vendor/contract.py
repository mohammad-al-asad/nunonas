"""Service provider agreement: template text, signature validation and PDF rendering.

The contract text below is a placeholder draft. Edit the party text and CONTRACT_SECTIONS
(and bump CONTRACT_VERSION) to change what providers see and sign; the registration page
loads the same text from GET /vendor/auth/contract, so both stay in sync.
"""

import base64
import binascii
import hashlib
import io
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from fpdf import FPDF

CONTRACT_VERSION = "2026-09-draft-2"
CONTRACT_TITLE = "Service Provider Agreement"
PLATFORM_NAME = "Activity Planner"
PLATFORM_ADDRESS = "Doha, State of Qatar"
JURISDICTION = "the State of Qatar"

# Party descriptions for the BETWEEN / AND blocks. The provider's business name and
# address come from the registration form.
PLATFORM_PARTY = (
    f'("Platform"), a company organized and existing under the laws of {JURISDICTION}, '
    "with its head office located at:"
)
PROVIDER_PARTY = (
    f'("Service Provider"), a business organized and existing under the laws of {JURISDICTION}, '
    "with its business address located at:"
)

# Numbered sections; clauses are displayed as <section>.<clause>.
CONTRACT_SECTIONS: list[tuple[str, list[str]]] = [
    (
        "Purpose of the Agreement",
        [
            "This Agreement sets out the terms and conditions under which the Service Provider lists its business "
            "and services on the Platform, an online marketplace through which customers discover and book "
            "restaurants, hotels, spas, events and related offers.",
        ],
    ),
    (
        "Listing and Accuracy of Information",
        [
            "The Service Provider shall keep all business details, prices, availability, images, menus, rooms, "
            "services and offers published on the Platform accurate and up to date.",
            "The Service Provider is solely responsible for the content it publishes and confirms that it holds "
            "all rights needed to publish it.",
        ],
    ),
    (
        "Licences and Legal Compliance",
        [
            "The Service Provider confirms that it holds a valid Commercial Registration, Trade License and all "
            "other permits required to operate its business, and shall keep them valid for the term of this "
            "Agreement.",
            "The Service Provider shall comply with all applicable laws, including health, safety, consumer "
            "protection and tax regulations.",
        ],
    ),
    (
        "Bookings and Service Delivery",
        [
            "The Service Provider shall honour all confirmed bookings and offers made through the Platform and "
            "deliver its services to customers with reasonable care and skill.",
            "Any cancellation by the Service Provider must be communicated to the customer through the Platform "
            "as early as possible.",
        ],
    ),
    (
        "Commission and Payment Terms",
        [
            "The Service Provider shall pay the Platform the commission rate shown in its service provider "
            "dashboard for each completed booking, unless otherwise agreed upon in writing.",
            "The Platform may update commission rates by giving the Service Provider at least thirty (30) days' "
            "written notice.",
        ],
    ),
    (
        "Customer Data and Privacy",
        [
            "Customer information shared with the Service Provider may be used only to fulfil the related "
            "booking. The Service Provider shall protect such information and shall not sell it, share it with "
            "third parties or use it for marketing without the customer's consent.",
        ],
    ),
    (
        "Reviews and Conduct",
        [
            "Customers may publish ratings and reviews of the Service Provider. The Service Provider shall not "
            "post fake reviews or offer incentives for positive reviews, and shall treat customers and Platform "
            "staff respectfully.",
        ],
    ),
    (
        "Term, Suspension and Termination",
        [
            "This Agreement takes effect on the date it is signed and continues until terminated by either Party.",
            "Either Party may terminate this Agreement by giving thirty (30) days' written notice.",
            "The Platform may suspend or remove the Service Provider's listings immediately if the Service "
            "Provider breaches this Agreement, provides false documents or information, or receives repeated "
            "serious customer complaints. Bookings confirmed before termination must still be honoured.",
        ],
    ),
    (
        "Liability and Indemnity",
        [
            "The Platform acts only as an intermediary and is not responsible for the services delivered by the "
            "Service Provider.",
            "The Service Provider shall indemnify the Platform against claims arising from its services, its "
            "content or its breach of this Agreement.",
        ],
    ),
    (
        "Changes to this Agreement",
        [
            "The Platform may update this Agreement from time to time. Material changes will be notified to the "
            "Service Provider, who may be asked to review and sign the updated version to continue using the "
            "Platform.",
        ],
    ),
    (
        "Governing Law and Disputes",
        [
            f"This Agreement is governed by the laws of {JURISDICTION}.",
            "The Parties shall first try to resolve any dispute amicably. Disputes that cannot be resolved "
            "amicably shall be referred to the competent courts of Doha, Qatar.",
        ],
    ),
    (
        "Electronic Signature",
        [
            "The Service Provider agrees that signing this Agreement electronically has the same legal effect as "
            "a handwritten signature, and that a copy of the signed Agreement will be stored by the Platform.",
        ],
    ),
]

SIGNATURE_DATA_URL_PREFIX = "data:image/png;base64,"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
MAX_SIGNATURE_BYTES = 300_000


def contract_template() -> dict[str, Any]:
    return {
        "version": CONTRACT_VERSION,
        "title": CONTRACT_TITLE,
        "platform_name": PLATFORM_NAME,
        "platform_address": PLATFORM_ADDRESS,
        "platform_party": PLATFORM_PARTY,
        "provider_party": PROVIDER_PARTY,
        "sections": [
            {"number": str(index), "heading": heading, "clauses": clauses}
            for index, (heading, clauses) in enumerate(CONTRACT_SECTIONS, start=1)
        ],
    }


def decode_signature_png(data_url: str) -> bytes:
    """Validate a canvas signature data URL and return the raw PNG bytes."""
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Please sign the Service Provider Agreement before submitting.",
    )
    if not data_url.startswith(SIGNATURE_DATA_URL_PREFIX):
        raise invalid
    try:
        png = base64.b64decode(data_url[len(SIGNATURE_DATA_URL_PREFIX):], validate=True)
    except (binascii.Error, ValueError) as exc:
        raise invalid from exc
    if not png.startswith(PNG_MAGIC) or len(png) > MAX_SIGNATURE_BYTES:
        raise invalid
    return png


_TYPOGRAPHIC = str.maketrans({"–": "-", "—": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "..."})


def _latin1(text: Any) -> str:
    # Built-in PDF fonts only cover Latin-1; replace anything else instead of failing.
    return str(text or "").translate(_TYPOGRAPHIC).encode("latin-1", "replace").decode("latin-1")


def _markdown_safe(text: Any) -> str:
    # fpdf2 markdown treats **, __ and -- as formatting markers.
    value = _latin1(text)
    for marker in ("**", "__", "--"):
        value = value.replace(marker, marker[0])
    return value


TEXT_COLOR = (30, 30, 30)
LABEL_WIDTH = 30  # mm, BETWEEN: / AND: column
NUMBER_WIDTH = 12  # mm, section/clause number column
LINE_HEIGHT = 5


class _ContractPDF(FPDF):
    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", size=8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 6, _latin1(f"{CONTRACT_TITLE} - version {CONTRACT_VERSION} - page {self.page_no()}/{{nb}}"), align="C")

    def columns(self, left: str, right: str, *, indent: float, left_style: str = "B", right_style: str = "") -> None:
        """Write a label or number in a fixed-width column and wrap the text beside it."""
        y = self.get_y()
        self.set_xy(self.l_margin, y)
        self.set_font("Helvetica", style=left_style, size=10)
        self.cell(indent, LINE_HEIGHT, _latin1(left))
        self.set_xy(self.l_margin + indent, y)
        self.set_font("Helvetica", style=right_style, size=10)
        self.multi_cell(0, LINE_HEIGHT, _latin1(right), new_x="LMARGIN", new_y="NEXT")

    def indented(self, text: str, *, indent: float, style: str = "") -> None:
        self.set_x(self.l_margin + indent)
        self.set_font("Helvetica", style=style, size=10)
        self.multi_cell(0, LINE_HEIGHT, _latin1(text), new_x="LMARGIN", new_y="NEXT")


def render_contract_pdf(*, details: dict[str, Any], signature_png: bytes, signed_at: datetime) -> bytes:
    """Render the signed agreement, including provider details and signature, as PDF bytes."""
    pdf = _ContractPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(20, 18, 20)
    pdf.add_page()
    pdf.set_text_color(*TEXT_COLOR)
    pdf.set_draw_color(*TEXT_COLOR)

    # Title with a rule underneath.
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, _latin1(CONTRACT_TITLE.upper()), new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_line_width(0.6)
    rule_y = pdf.get_y() + 1
    pdf.line(pdf.l_margin, rule_y, pdf.w - pdf.r_margin, rule_y)
    pdf.set_line_width(0.2)
    pdf.ln(7)

    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(
        0,
        LINE_HEIGHT,
        _latin1(f'This {CONTRACT_TITLE} ("Agreement") is entered into effect as of {signed_at.strftime("%d %B %Y")},'),
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(5)

    # Parties.
    parties = (
        ("BETWEEN:", PLATFORM_NAME, PLATFORM_PARTY, PLATFORM_ADDRESS),
        ("AND:", str(details.get("Business name") or ""), PROVIDER_PARTY, str(details.get("Address") or "-")),
    )
    for label, name, description, address in parties:
        # Party name in bold, followed inline by its description.
        y = pdf.get_y()
        pdf.set_font("Helvetica", style="B", size=10)
        pdf.cell(LABEL_WIDTH, LINE_HEIGHT, label)
        pdf.set_xy(pdf.l_margin + LABEL_WIDTH, y)
        pdf.set_font("Helvetica", size=10)
        pdf.multi_cell(
            0,
            LINE_HEIGHT,
            f"**{_markdown_safe(name.upper())}** {_markdown_safe(description)}",
            markdown=True,
            new_x="LMARGIN",
            new_y="NEXT",
        )
        pdf.ln(3)
        pdf.indented(address, indent=LABEL_WIDTH, style="B")
        pdf.ln(6)

    # Numbered sections and clauses.
    for index, (heading, clauses) in enumerate(CONTRACT_SECTIONS, start=1):
        if pdf.get_y() > pdf.h - 40:
            pdf.add_page()
        pdf.columns(f"{index}.", heading.upper(), indent=NUMBER_WIDTH, right_style="B")
        pdf.ln(3)
        for clause_index, clause in enumerate(clauses, start=1):
            pdf.columns(f"{index}.{clause_index}", clause, indent=NUMBER_WIDTH, left_style="")
            pdf.ln(2.5)
        pdf.ln(2)

    # Schedule with the registration details.
    if pdf.get_y() > pdf.h - 70:
        pdf.add_page()
    pdf.ln(2)
    pdf.set_font("Helvetica", style="B", size=10)
    pdf.cell(0, 6, "SCHEDULE A - SERVICE PROVIDER DETAILS", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    for label, value in details.items():
        pdf.columns(label, str(value or "-"), indent=45)
    pdf.ln(6)

    # Signature block, kept together on one page.
    if pdf.get_y() > pdf.h - 70:
        pdf.add_page()
    pdf.set_font("Helvetica", style="B", size=10)
    pdf.cell(0, 6, "SIGNED BY THE SERVICE PROVIDER", new_x="LMARGIN", new_y="NEXT")
    top = pdf.get_y() + 1
    pdf.image(io.BytesIO(signature_png), x=pdf.l_margin, y=top, w=80, h=32, keep_aspect_ratio=True)
    pdf.line(pdf.l_margin, top + 33, pdf.l_margin + 80, top + 33)
    pdf.set_y(top + 35)
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, LINE_HEIGHT, _latin1(f"Name: {details.get('Owner / Manager') or ''}"), new_x="LMARGIN", new_y="NEXT")
    pdf.multi_cell(0, LINE_HEIGHT, _latin1(f"For and on behalf of: {details.get('Business name') or ''}"), new_x="LMARGIN", new_y="NEXT")
    pdf.multi_cell(0, LINE_HEIGHT, f"Signed electronically on {signed_at.strftime('%d %B %Y at %H:%M UTC')}", new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
