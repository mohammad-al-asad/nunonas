import { type BusinessDetails, type Invoice, formatDate, formatMoney, lineRate } from "@/lib/billing";

// Minimal single-page PDF (Helvetica, US Letter) for a monthly commission invoice:
// the platform bills the service provider for commission on completed bookings.

const BRAND: [number, number, number] = [0.12, 0.24, 0.56];
const MUTED: [number, number, number] = [0.42, 0.48, 0.58];
const TEXT: [number, number, number] = [0.11, 0.16, 0.26];

// Helvetica is WinAnsi-encoded; keep the stream ASCII so the byte length is exact.
function ascii(value: string) {
  return value.replace(/[‐-―]/g, "-").replace(/[^\x20-\x7e]/g, "?");
}

function escapePdf(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// Standard Helvetica / Helvetica-Bold advance widths (1/1000 em) for ASCII 32-126, used to right-align text.
const REGULAR_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
  556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611,
  611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

function textWidth(value: string, size: number, bold = false) {
  const widths = bold ? BOLD_WIDTHS : REGULAR_WIDTHS;
  let total = 0;
  for (const char of ascii(value)) total += widths[char.charCodeAt(0) - 32] ?? 556;
  return (total / 1000) * size;
}

export function buildInvoicePdf(invoice: Invoice, business: BusinessDetails): string {
  const ops: string[] = [];
  const color = ([r, g, b]: [number, number, number]) => ops.push(`${r} ${g} ${b} rg`);
  const stroke = ([r, g, b]: [number, number, number]) => ops.push(`${r} ${g} ${b} RG`);
  const text = (x: number, y: number, size: number, value: string, bold = false, tone: [number, number, number] = TEXT) => {
    color(tone);
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y} Td (${escapePdf(value)}) Tj ET`);
  };
  const right = (x: number, y: number, size: number, value: string, bold = false, tone: [number, number, number] = TEXT) =>
    text(x - textWidth(value, size, bold), y, size, value, bold, tone);
  const line = (x1: number, y1: number, x2: number, y2: number) => ops.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  const fillRect = (x: number, y: number, w: number, h: number, tone: [number, number, number]) => {
    color(tone);
    ops.push(`${x} ${y} ${w} ${h} re f`);
  };
  const strokeRect = (x: number, y: number, w: number, h: number) => ops.push(`${x} ${y} ${w} ${h} re S`);

  const left = 48;
  const end = 564;
  stroke([0.87, 0.89, 0.93]);
  ops.push("0.8 w");

  // Header: app name as the brand, invoice meta on the right.
  text(left, 742, 22, business.name || "Activity Planner", true, BRAND);
  text(left, 726, 9, "Commission invoice", false, MUTED);
  right(end, 742, 20, "INVOICE", true, TEXT);
  right(end, 726, 9, invoice.invoiceNumber, false, MUTED);

  const meta: Array<[string, string]> = [
    ["Invoice date", formatDate(new Date().toISOString())],
    ["Billing period", invoice.periodLabel],
    ["Due date", formatDate(invoice.dueDate)],
    ["Status", invoice.status === "PAID" ? `Paid ${formatDate(invoice.paidAt)}` : invoice.overdue ? "Overdue" : "Unpaid"],
  ];
  meta.forEach(([label, value], index) => {
    const y = 700 - index * 14;
    text(380, y, 9, label, false, MUTED);
    right(end, y, 9, value, true);
  });

  // From (the platform) / Bill to (the service provider).
  const boxTop = 630;
  const boxHeight = 96;
  const box = (x: number, title: string, rows: string[]) => {
    strokeRect(x, boxTop - boxHeight, 250, boxHeight);
    text(x + 12, boxTop - 18, 9, title, true, BRAND);
    rows.filter(Boolean).slice(0, 5).forEach((row, index) => {
      text(x + 12, boxTop - 34 - index * 13, index === 0 ? 10 : 9, row, index === 0, index === 0 ? TEXT : MUTED);
    });
  };
  box(left, "FROM", [business.name || "Activity Planner", business.address, business.email, business.phone]);
  const provider = invoice.provider;
  box(314, "BILL TO", [
    provider.name,
    provider.owner ? `Attn: ${provider.owner}` : "",
    provider.address,
    provider.email,
    provider.phone,
  ]);

  // Commission lines.
  const columns = { description: left + 10, bookings: 300, value: 400, rate: 420, amount: end - 10 };
  let y = 500;
  fillRect(left, y - 8, end - left, 24, [0.93, 0.95, 0.99]);
  text(columns.description, y, 9, "Description", true, BRAND);
  right(columns.bookings, y, 9, "Bookings", true, BRAND);
  right(columns.value, y, 9, "Booking value", true, BRAND);
  text(columns.rate, y, 9, "Rate", true, BRAND);
  right(columns.amount, y, 9, "Amount", true, BRAND);

  y -= 28;
  const lines = invoice.lines.length ? invoice.lines : [];
  lines.slice(0, 12).forEach((item) => {
    text(columns.description, y, 9, `${item.label} ${item.model === "per_lead" ? "leads" : "bookings"}`);
    right(columns.bookings, y, 9, String(item.bookings));
    right(columns.value, y, 9, formatMoney(item.bookingValue));
    text(columns.rate, y, 9, item.model === "per_lead" ? `${formatMoney(item.rate)}/lead` : lineRate(item));
    right(columns.amount, y, 9, formatMoney(item.commission));
    line(left, y - 9, end, y - 9);
    y -= 24;
  });
  if (!lines.length) {
    text(columns.description, y, 9, "No completed bookings in this period.", false, MUTED);
    y -= 24;
  }

  // Summary: commission is the whole amount owed; there is no tax.
  const summaryTop = y - 10;
  const rows: Array<[string, string, boolean]> = [
    ["Completed bookings", String(invoice.bookings), false],
    ["Booking value (for reference)", formatMoney(invoice.bookingValue), false],
    ["Commission", formatMoney(invoice.amountDue), false],
  ];
  rows.forEach(([label, value], index) => {
    const rowY = summaryTop - index * 16;
    text(330, rowY, 9, label, false, MUTED);
    right(end, rowY, 9, value);
  });
  const totalY = summaryTop - rows.length * 16 - 14;
  fillRect(320, totalY - 9, end - 320, 26, BRAND);
  text(330, totalY, 11, invoice.status === "PAID" ? "Total paid" : "Total due", true, [1, 1, 1]);
  right(end - 10, totalY, 11, formatMoney(invoice.amountDue), true, [1, 1, 1]);

  // Notes.
  const noteY = totalY - 48;
  text(left, noteY, 9, "Notes", true, BRAND);
  const notes = [
    `Commission on bookings completed with ${business.name || "Activity Planner"} in ${invoice.periodLabel}.`,
    "Percentage rates apply to the booking subtotal after discounts. Per-lead fees apply to each completed booking.",
    invoice.status === "PAID"
      ? `Payment received on ${formatDate(invoice.paidAt)}. Thank you.`
      : `Please pay ${formatMoney(invoice.amountDue)} by ${formatDate(invoice.dueDate)}.`,
  ];
  notes.forEach((note, index) => text(left, noteY - 14 - index * 12, 8, note, false, MUTED));
  if (business.email) {
    text(left, 48, 8, `Questions about this invoice? Contact ${business.email}`, false, MUTED);
  }

  const stream = ops.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
