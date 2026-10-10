"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  FiAlertCircle,
  FiBell,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiRotateCcw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { CommissionRatesPanel } from "@/components/billing/commission-rates";
import {
  type BillingOverview,
  type CommissionRates,
  type Invoice,
  formatDate,
  formatMoney,
  lineRate,
} from "@/lib/billing";
import { buildInvoicePdf } from "@/lib/billing-invoice-pdf";

const pageSize = 8;

function StatusBadge({ invoice }: { invoice: Invoice }) {
  if (invoice.status === "PAID") {
    return <span className="inline-flex rounded-full bg-[#dcfce7] px-2 py-1 text-[10px] font-semibold text-[#15803d]">PAID</span>;
  }
  if (invoice.overdue) {
    return <span className="inline-flex rounded-full bg-[#fee2e2] px-2 py-1 text-[10px] font-semibold text-[#b91c1c]">OVERDUE</span>;
  }
  return <span className="inline-flex rounded-full bg-[#fef3c7] px-2 py-1 text-[10px] font-semibold text-[#b45309]">UNPAID</span>;
}

export function BillingManagementView({ data }: { data: BillingOverview }) {
  const [overview, setOverview] = useState<BillingOverview>(data);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Invoice[] | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ invoice: Invoice; next: "PAID" | "UNPAID" } | null>(null);
  const [actionLoading, setActionLoading] = useState<"status" | "reminder" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selected = useMemo(
    () => overview.invoices.find((invoice) => invoice.id === selectedId) ?? history?.find((invoice) => invoice.id === selectedId) ?? null,
    [history, overview.invoices, selectedId],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return overview.invoices;
    return overview.invoices.filter((invoice) =>
      [invoice.provider.name, invoice.provider.vendorCode, invoice.provider.category, invoice.invoiceNumber]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [overview.invoices, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const loadPeriod = useCallback(async (period: string) => {
    setPeriodLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/billing?period=${encodeURIComponent(period)}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      setOverview((await response.json()) as BillingOverview);
      setPage(1);
    } catch {
      setLoadError("Couldn't load billing for that month. Try again.");
    } finally {
      setPeriodLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (vendorId: string) => {
    setHistory(null);
    try {
      const response = await fetch(`/api/billing/providers/${encodeURIComponent(vendorId)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { invoices?: Invoice[] };
      setHistory(response.ok ? payload.invoices ?? [] : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (selected) void loadHistory(selected.provider.vendorId);
    // Only reload history when a different provider is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.provider.vendorId, loadHistory]);

  const openInvoice = (invoice: Invoice) => {
    setActionError(null);
    setSelectedId(invoice.id);
  };

  // Show the server's updated invoice immediately; the summary cards are recomputed from the list.
  const applyUpdatedInvoice = (updated: Invoice) => {
    setHistory((prev) => prev?.map((invoice) => (invoice.id === updated.id ? updated : invoice)) ?? prev);
    setOverview((prev) => {
      if (updated.period !== prev.period) return prev;
      const invoices = prev.invoices.map((invoice) => (invoice.id === updated.id ? updated : invoice));
      const sum = (rows: Invoice[]) => Math.round(rows.reduce((total, row) => total + row.amountDue, 0) * 100) / 100;
      const paid = invoices.filter((invoice) => invoice.status === "PAID");
      const unpaid = invoices.filter((invoice) => invoice.status === "UNPAID");
      return {
        ...prev,
        invoices,
        summary: {
          ...prev.summary,
          commissionDue: sum(invoices),
          collected: sum(paid),
          outstanding: sum(unpaid),
          unpaidInvoices: unpaid.length,
        },
      };
    });
  };

  const changeStatus = async (invoice: Invoice, next: "PAID" | "UNPAID") => {
    setActionLoading("status");
    setActionError(null);
    try {
      const response = await fetch(
        `/api/billing/providers/${encodeURIComponent(invoice.provider.vendorId)}/invoices/${invoice.period}/status`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) },
      );
      const payload = (await response.json().catch(() => ({}))) as { invoice?: Invoice; detail?: string };
      if (!response.ok || !payload.invoice) throw new Error(payload.detail || "Couldn't update the invoice.");
      applyUpdatedInvoice(payload.invoice);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't update the invoice.");
    } finally {
      setActionLoading(null);
    }
  };

  const recordReminder = async (invoice: Invoice) => {
    setActionLoading("reminder");
    setActionError(null);
    try {
      const response = await fetch(
        `/api/billing/providers/${encodeURIComponent(invoice.provider.vendorId)}/invoices/${invoice.period}/reminder`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      const payload = (await response.json().catch(() => ({}))) as { invoice?: Invoice; detail?: string };
      if (!response.ok || !payload.invoice) throw new Error(payload.detail || "Couldn't record the reminder.");
      applyUpdatedInvoice(payload.invoice);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't record the reminder.");
    } finally {
      setActionLoading(null);
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    const blob = new Blob([buildInvoicePdf(invoice, overview.business)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: "Completed booking value",
      value: formatMoney(overview.summary.bookingValue),
      note: `${overview.summary.completedBookings.toLocaleString()} completed bookings`,
      icon: <FiDollarSign size={16} />,
    },
    {
      label: "Commission earned",
      value: formatMoney(overview.summary.commissionDue),
      note: `${overview.summary.providers.toLocaleString()} providers billed`,
      icon: <FiCheckCircle size={16} />,
    },
    {
      label: "Collected",
      value: formatMoney(overview.summary.collected),
      note: "Invoices marked paid",
      icon: <FiCheckCircle size={16} />,
    },
    {
      label: "Outstanding",
      value: formatMoney(overview.summary.outstanding),
      note: `${overview.summary.unpaidInvoices.toLocaleString()} unpaid invoices`,
      icon: <FiClock size={16} />,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-[12px] text-[#7d8ba6]">
          Monthly commission invoices for completed bookings. The amount due is what each service provider owes {overview.business.name || "Activity Planner"}.
        </p>
        <label className="flex items-center gap-2 text-[11px] text-[#64748b]">
          Billing month
          <select
            value={overview.period}
            onChange={(event) => void loadPeriod(event.target.value)}
            disabled={periodLoading}
            className="h-8 rounded-full border border-[#e6ecf7] bg-white px-3 text-[11px] font-semibold text-[#1f2d46] outline-none disabled:opacity-60"
          >
            {overview.periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loadError && <p className="m-0 text-[11px] text-[#ef4444]">{loadError}</p>}

      <section className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${periodLoading ? "opacity-60" : ""}`}>
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-[#edf2fb] text-[#1f3d8f]">{card.icon}</div>
            <p className="m-0 text-[10px] text-[#7d8ba6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[24px] leading-none text-[#1d2a43] tabular-nums">{card.value}</h3>
            <p className="m-0 mt-2 text-[10px] text-[#94a3b8]">{card.note}</p>
          </article>
        ))}
      </section>

      <CommissionRatesPanel
        rates={overview.rates}
        onSaved={(rates: CommissionRates) => setOverview((prev) => ({ ...prev, rates }))}
      />

      <section className={`overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white ${periodLoading ? "opacity-60" : ""}`}>
        <div className="flex flex-col gap-3 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Invoices · {overview.periodLabel}</h3>
          <div className="flex h-8 min-w-[260px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
            <FiSearch size={12} className="text-[#8b96ad]" />
            <input
              type="text"
              placeholder="Search provider, category or invoice no..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
            />
          </div>
        </div>

        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[900px] border-collapse text-[12px]">
            <thead>
              <tr>
                {["SERVICE PROVIDER", "CATEGORY", "COMPLETED BOOKINGS", "BOOKING VALUE", "COMMISSION DUE", "STATUS", ""].map((head) => (
                  <th key={head} className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-[#94a3b8]">
                    {query ? "No invoices match your search." : `No completed bookings in ${overview.periodLabel}, so there's nothing to bill.`}
                  </td>
                </tr>
              )}
              {paged.map((invoice, index) => (
                <tr key={invoice.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#edf2fb] text-[10px] font-semibold text-[#3f4f70]">
                        {invoice.provider.vendorCode.slice(0, 3)}
                      </div>
                      <div>
                        <p className="m-0 text-[12px] text-[#1f2d46]">{invoice.provider.name}</p>
                        <p className="m-0 text-[10px] text-[#94a3b8]">{invoice.invoiceNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{invoice.provider.category}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60] tabular-nums">{invoice.bookings}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#8b96ad] tabular-nums">{formatMoney(invoice.bookingValue)}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 font-semibold text-[#1f3d8f] tabular-nums">{formatMoney(invoice.amountDue)}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <StatusBadge invoice={invoice} />
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1f3d8f]"
                      onClick={() => openInvoice(invoice)}
                    >
                      <FiEye size={13} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} invoices
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="grid h-6 w-6 place-items-center rounded border border-[#e6ecf7] text-[#64748b] disabled:opacity-50"
              aria-label="Previous page"
            >
              <FiChevronLeft size={12} />
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="grid h-6 w-6 place-items-center rounded border border-[#e6ecf7] text-[#64748b] disabled:opacity-50"
              aria-label="Next page"
            >
              <FiChevronRight size={12} />
            </button>
          </div>
        </footer>
      </section>

      {selected &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40 bg-[#0f172a]/35" onClick={() => setSelectedId(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" onClick={() => setSelectedId(null)}>
              <div
                className="max-h-full w-full max-w-[920px] overflow-y-auto rounded-3xl border border-[#e6ecf7] bg-[#f8fafc] shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e6ecf7] bg-white px-6 py-5">
                  <div>
                    <h3 className="m-0 text-[16px] font-semibold text-[#1d2a43]">
                      Invoice {selected.invoiceNumber}
                    </h3>
                    <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">
                      Commission on bookings completed in {selected.periodLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadInvoice(selected)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f]"
                    >
                      <FiDownload size={12} />
                      Download invoice
                    </button>
                    {selected.status === "UNPAID" && (
                      <button
                        type="button"
                        onClick={() => void recordReminder(selected)}
                        disabled={actionLoading !== null}
                        title="Records that you reminded this provider. No email is sent."
                        className="inline-flex items-center gap-2 rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1.5 text-[10px] font-semibold text-[#b45309] disabled:opacity-60"
                      >
                        <FiBell size={12} />
                        {actionLoading === "reminder" ? "Saving..." : "Log reminder"}
                      </button>
                    )}
                    {selected.status === "UNPAID" ? (
                      <button
                        type="button"
                        onClick={() => setStatusConfirm({ invoice: selected, next: "PAID" })}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1f3d8f] px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-60"
                      >
                        <FiCheckCircle size={12} />
                        {actionLoading === "status" ? "Saving..." : "Mark as paid"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStatusConfirm({ invoice: selected, next: "UNPAID" })}
                        disabled={actionLoading !== null}
                        className="inline-flex items-center gap-2 rounded-full border border-[#fecaca] bg-[#fff5f5] px-3 py-1.5 text-[10px] font-semibold text-[#b91c1c] disabled:opacity-60"
                      >
                        <FiRotateCcw size={12} />
                        {actionLoading === "status" ? "Saving..." : "Mark as unpaid"}
                      </button>
                    )}
                    <button type="button" onClick={() => setSelectedId(null)} className="text-[#94a3b8]" aria-label="Close invoice">
                      <FiX size={16} />
                    </button>
                  </div>
                </header>

                <div className="space-y-4 px-6 py-5">
                  {actionError && (
                    <p className="m-0 flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-[11px] text-[#b91c1c]">
                      <FiAlertCircle size={13} />
                      {actionError}
                    </p>
                  )}

                  <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f3d8f] to-[#60a5fa]">
                          {selected.provider.image && (
                            <Image src={selected.provider.image} alt={selected.provider.name} fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[9px] font-semibold tracking-[0.08em] text-[#94a3b8]">BILL TO</p>
                          <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">{selected.provider.name}</h4>
                          <p className="m-0 mt-0.5 text-[10px] text-[#94a3b8]">
                            {[selected.provider.owner, selected.provider.email, selected.provider.phone].filter(Boolean).join(" · ") || "No contact details"}
                          </p>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-[9px]">
                            <div>
                              <p className="m-0 text-[8px] text-[#94a3b8]">CATEGORY</p>
                              <p className="m-0 font-semibold text-[#1f2d46]">{selected.provider.category}</p>
                            </div>
                            <div>
                              <p className="m-0 text-[8px] text-[#94a3b8]">JOINED</p>
                              <p className="m-0 font-semibold text-[#1f2d46]">{selected.provider.joinedDate || "—"}</p>
                            </div>
                            <div>
                              <p className="m-0 text-[8px] text-[#94a3b8]">REMINDER</p>
                              <p className="m-0 font-semibold text-[#1f2d46]">
                                {selected.reminderSentAt ? formatDate(selected.reminderSentAt) : "None logged"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#1f3d8f] bg-[#1f3d8f] p-4 text-white">
                      <p className="m-0 text-[10px] text-white/70">
                        {selected.status === "PAID" ? "Paid to" : "Amount due to"} {overview.business.name || "Activity Planner"}
                      </p>
                      <p className="m-0 mt-2 text-[22px] font-semibold tabular-nums">{formatMoney(selected.amountDue)}</p>
                      <div className="mt-3 space-y-0.5 text-[10px] text-white/80">
                        <p className="m-0">Due date: {formatDate(selected.dueDate)}</p>
                        <p className="m-0">
                          Status:{" "}
                          {selected.status === "PAID"
                            ? `Paid on ${formatDate(selected.paidAt)}`
                            : selected.overdue
                              ? "Overdue"
                              : "Unpaid"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                    <h4 className="m-0 text-[12px] font-semibold text-[#1f2d46]">Commission breakdown</h4>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[560px] border-collapse text-[11px]">
                        <thead>
                          <tr className="text-left text-[9px] tracking-[0.04em] text-[#94a3b8]">
                            <th className="px-2 py-2 font-medium">DESCRIPTION</th>
                            <th className="px-2 py-2 text-right font-medium">BOOKINGS</th>
                            <th className="px-2 py-2 text-right font-medium">BOOKING VALUE</th>
                            <th className="px-2 py-2 font-medium">RATE</th>
                            <th className="px-2 py-2 text-right font-medium">COMMISSION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.lines.map((line) => (
                            <tr key={`${line.category}-${line.model}-${line.rate}`} className="border-t border-[#edf1fa] text-[#1f2d46]">
                              <td className="px-2 py-2">
                                {line.label} {line.model === "per_lead" ? "leads" : "bookings"}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums">{line.bookings}</td>
                              <td className="px-2 py-2 text-right tabular-nums text-[#64748b]">{formatMoney(line.bookingValue)}</td>
                              <td className="px-2 py-2">{lineRate(line)}</td>
                              <td className="px-2 py-2 text-right font-semibold tabular-nums">{formatMoney(line.commission)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-[#dbe2ef] text-[#1f2d46]">
                            <td className="px-2 py-2 font-semibold">Total due</td>
                            <td className="px-2 py-2 text-right tabular-nums">{selected.bookings}</td>
                            <td className="px-2 py-2 text-right tabular-nums text-[#64748b]">{formatMoney(selected.bookingValue)}</td>
                            <td />
                            <td className="px-2 py-2 text-right text-[13px] font-semibold tabular-nums text-[#1f3d8f]">
                              {formatMoney(selected.amountDue)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="m-0 mt-2 text-[10px] text-[#94a3b8]">
                      Percentages apply to the booking total after discounts. Each booking
                      uses the rate that was active when it was made.
                      {selected.status === "PAID" ? " This invoice was locked when it was marked paid." : ""}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                    <h4 className="m-0 text-[12px] font-semibold text-[#1f2d46]">Payment history</h4>
                    <div className="mt-3 rounded-xl border border-[#edf1fa]">
                      {history === null && <p className="m-0 px-3 py-3 text-[11px] text-[#94a3b8]">Loading...</p>}
                      {history?.length === 0 && <p className="m-0 px-3 py-3 text-[11px] text-[#94a3b8]">No invoices yet.</p>}
                      {history?.map((row) => (
                        <button
                          type="button"
                          key={row.id}
                          onClick={() => openInvoice(row)}
                          className={`flex w-full items-center justify-between gap-3 border-b border-[#edf1fa] px-3 py-2 text-left text-[10px] text-[#64748b] last:border-b-0 ${
                            row.id === selected.id ? "bg-[#f3f6fd]" : "hover:bg-[#f8fafc]"
                          }`}
                        >
                          <span className="w-[120px] font-semibold text-[#1f2d46]">{row.periodLabel}</span>
                          <span className="w-[140px]">{row.invoiceNumber}</span>
                          <span className="w-[90px] text-right tabular-nums">{formatMoney(row.amountDue)}</span>
                          <span className="w-[70px] text-right">
                            <StatusBadge invoice={row} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {statusConfirm &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60] bg-[#0f172a]/40" onClick={() => setStatusConfirm(null)} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setStatusConfirm(null)}>
              <div
                className="w-full max-w-[420px] rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">
                  {statusConfirm.next === "PAID" ? "Mark as paid?" : "Mark as unpaid?"}
                </h4>
                <p className="m-0 mt-2 text-[11px] leading-5 text-[#64748b]">
                  {statusConfirm.next === "PAID"
                    ? `Confirm that ${statusConfirm.invoice.provider.name} paid ${formatMoney(statusConfirm.invoice.amountDue)} for ${statusConfirm.invoice.periodLabel}. The invoice amount is locked once it's paid.`
                    : `This moves ${statusConfirm.invoice.invoiceNumber} back to unpaid and recalculates it from the bookings. Use this to undo a payment marked by mistake.`}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusConfirm(null)}
                    className="rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f2d46]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const { invoice, next } = statusConfirm;
                      setStatusConfirm(null);
                      void changeStatus(invoice, next);
                    }}
                    className={`rounded-full px-4 py-2 text-[11px] font-semibold text-white ${
                      statusConfirm.next === "PAID" ? "bg-[#1f3d8f]" : "bg-[#b91c1c]"
                    }`}
                  >
                    {statusConfirm.next === "PAID" ? "Mark as paid" : "Mark as unpaid"}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </section>
  );
}
