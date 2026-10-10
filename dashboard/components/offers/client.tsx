"use client";

import { useEffect, useState } from "react";
import { FiChevronRight, FiPlus, FiX } from "react-icons/fi";
import {
  type OfferState,
  type PlatformOffer,
  type PlatformOfferDetail,
  type ProviderResponse,
  formatOfferDay,
} from "@/lib/offers-admin";

const fieldClass =
  "mt-1 w-full rounded-xl border border-[#e6ecf7] bg-white px-3 py-2.5 text-[13px] text-[#1f2d46] outline-none focus:border-[#1f3d8f]";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-[#6c7890]";

const STATE_STYLES: Record<OfferState, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-[#ecfdf5] text-[#047857]" },
  upcoming: { label: "Upcoming", className: "bg-[#eff6ff] text-[#1d4ed8]" },
  ended: { label: "Ended", className: "bg-[#f1f5f9] text-[#475569]" },
};

const RESPONSE_STYLES: Record<ProviderResponse, { label: string; className: string }> = {
  accepted: { label: "Accepted", className: "bg-[#ecfdf5] text-[#047857]" },
  pending: { label: "No answer yet", className: "bg-[#fff7ed] text-[#c2410c]" },
  rejected: { label: "Rejected", className: "bg-[#f1f5f9] text-[#475569]" },
};

const EMPTY_DRAFT = {
  name: "",
  purpose: "",
  discount_type: "percentage",
  discount_value: "",
  start_date: "",
  end_date: "",
};

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { detail?: unknown };
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    const first = payload.detail[0] as { msg?: unknown } | undefined;
    if (typeof first?.msg === "string") return first.msg.replace(/^Value error, /, "");
  }
  return fallback;
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function OffersManagementView({ initialOffers }: { initialOffers: PlatformOffer[] }) {
  const [offers, setOffers] = useState(initialOffers);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlatformOfferDetail | null>(null);
  const [detailError, setDetailError] = useState("");

  const live = offers.filter((offer) => offer.state === "live");
  const stats = [
    { label: "Live offers", value: live.length },
    { label: "Upcoming offers", value: offers.filter((offer) => offer.state === "upcoming").length },
    { label: "Providers in live offers", value: live.reduce((sum, offer) => sum + offer.accepted, 0) },
    { label: "Bookings with an offer", value: offers.reduce((sum, offer) => sum + offer.bookings, 0) },
  ];

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    fetch(`/api/offers/${encodeURIComponent(selectedId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response, "Could not load this offer."));
        return (await response.json()) as PlatformOfferDetail;
      })
      .then((data) => active && setDetail(data))
      .catch((error: unknown) => active && setDetailError(error instanceof Error ? error.message : "Could not load this offer."));
    return () => {
      active = false;
    };
  }, [selectedId]);

  const openDetail = (id: string) => {
    setDetail(null);
    setDetailError("");
    setSelectedId(id);
  };

  const closeCreate = () => {
    if (saving) return;
    setCreating(false);
    setFormError("");
  };

  const create = async () => {
    const value = Number(draft.discount_value);
    if (!draft.name.trim() || !draft.purpose.trim()) return setFormError("Add a name and the purpose of the campaign.");
    if (!Number.isFinite(value) || value <= 0) return setFormError("Enter a discount above 0.");
    if (draft.discount_type === "percentage" && value > 100) return setFormError("A percentage discount cannot be more than 100%.");
    if (!draft.start_date || !draft.end_date) return setFormError("Choose the start and end dates.");
    if (draft.end_date < draft.start_date) return setFormError("The end date must be on or after the start date.");
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, name: draft.name.trim(), purpose: draft.purpose.trim(), discount_value: value }),
      });
      if (!response.ok) throw new Error(await readError(response, "Could not create the offer."));
      const list = await fetch("/api/offers", { cache: "no-store" });
      if (list.ok) setOffers(((await list.json()) as { offers?: PlatformOffer[] }).offers ?? []);
      setCreating(false);
      setDraft(EMPTY_DRAFT);
      setNotice("Offer created. Every provider has been notified in their portal and by email.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create the offer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <section className="rounded-2xl border border-[#e6ecf7] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-[16px] font-semibold text-[#1d2a43]">Platform offers</h2>
            <p className="m-0 mt-1 max-w-2xl text-[12px] text-[#6c7890]">
              Campaigns for every provider. Each provider accepts or rejects an offer on their Offers page; accepted offers
              discount that provider&apos;s bookings during the offer period. Offers can&apos;t be edited after they are created.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotice("");
              setCreating(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1f3d8f] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1a3479]"
          >
            <FiPlus size={14} /> Create offer
          </button>
        </div>
        {notice ? <p role="status" className="m-0 mt-4 rounded-xl bg-[#ecfdf5] px-3 py-2 text-[12px] font-medium text-[#047857]">{notice}</p> : null}
        <dl className="m-0 mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#eef2f8] bg-[#f8fafc] px-4 py-3">
              <dt className={labelClass}>{stat.label}</dt>
              <dd className="m-0 mt-1 text-[22px] font-semibold text-[#1d2a43]">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        {offers.length === 0 ? (
          <p className="m-0 p-10 text-center text-[13px] text-[#6c7890]">No offers yet. Create one to start a campaign.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f8fafc] text-left text-[10px] uppercase tracking-wide text-[#8b96ad]">
                  <th className="px-4 py-3 font-semibold">Offer</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Accepted</th>
                  <th className="px-4 py-3 font-semibold">Rejected</th>
                  <th className="px-4 py-3 font-semibold">No answer</th>
                  <th className="px-4 py-3 font-semibold">Bookings</th>
                  <th className="px-4 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id} className="border-t border-[#eef2f8]">
                    <td className="px-4 py-3">
                      <p className="m-0 font-semibold text-[#1d2a43]">{offer.name}</p>
                      <p className="m-0 mt-0.5 line-clamp-1 max-w-xs text-[12px] text-[#6c7890]">{offer.purpose}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1d2a43]">{offer.discount_label}</td>
                    <td className="px-4 py-3 text-[#5b6e92]">{formatOfferDay(offer.start_date)} – {formatOfferDay(offer.end_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATE_STYLES[offer.state].className}`}>
                        {STATE_STYLES[offer.state].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#1d2a43]">{offer.accepted}</td>
                    <td className="px-4 py-3 tabular-nums text-[#1d2a43]">{offer.rejected}</td>
                    <td className="px-4 py-3 tabular-nums text-[#1d2a43]">{offer.pending}</td>
                    <td className="px-4 py-3 tabular-nums text-[#1d2a43]">{offer.bookings}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(offer.id)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1f3d8f] hover:underline"
                      >
                        View <FiChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={closeCreate}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-offer-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="create-offer-title" className="m-0 text-[15px] font-semibold text-[#1d2a43]">Create a platform offer</h3>
                <p className="m-0 mt-1 text-[12px] text-[#6c7890]">
                  Every provider is notified in their portal and by email. The offer can&apos;t be changed after it is created.
                </p>
              </div>
              <button type="button" onClick={closeCreate} aria-label="Close" className="rounded-lg p-1 text-[#6c7890] hover:bg-[#f1f5f9]">
                <FiX size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className={labelClass}>Offer name</span>
                <input value={draft.name} maxLength={120} placeholder="e.g. Summer 50% Off" onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Purpose of the campaign</span>
                <textarea value={draft.purpose} maxLength={500} rows={3} placeholder="Shown to providers and customers" onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} className={fieldClass} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Discount type</span>
                  <select value={draft.discount_type} onChange={(event) => setDraft({ ...draft, discount_type: event.target.value })} className={fieldClass}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed amount</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>{draft.discount_type === "percentage" ? "Discount (%)" : "Discount amount"}</span>
                  <input type="number" min="0" max={draft.discount_type === "percentage" ? 100 : undefined} value={draft.discount_value} onChange={(event) => setDraft({ ...draft, discount_value: event.target.value })} className={fieldClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Start date</span>
                  <input type="date" min={todayKey()} value={draft.start_date} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} className={fieldClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>End date</span>
                  <input type="date" min={draft.start_date || todayKey()} value={draft.end_date} onChange={(event) => setDraft({ ...draft, end_date: event.target.value })} className={fieldClass} />
                </label>
              </div>
            </div>
            {formError ? <p role="alert" className="m-0 mt-3 rounded-xl bg-[#fef2f2] px-3 py-2 text-[12px] font-medium text-[#b91c1c]">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeCreate} disabled={saving} className="rounded-xl border border-[#e6ecf7] px-4 py-2 text-[12px] font-semibold text-[#475569] disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={() => void create()} disabled={saving} className="rounded-xl bg-[#1f3d8f] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50">
                {saving ? "Creating..." : "Create and notify providers"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="offer-detail-title" className="m-0 text-[15px] font-semibold text-[#1d2a43]">{detail?.name ?? "Offer"}</h3>
                {detail ? (
                  <p className="m-0 mt-1 text-[12px] text-[#6c7890]">
                    {detail.discount_label} · {formatOfferDay(detail.start_date)} – {formatOfferDay(detail.end_date)} · {STATE_STYLES[detail.state].label}
                  </p>
                ) : null}
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="rounded-lg p-1 text-[#6c7890] hover:bg-[#f1f5f9]">
                <FiX size={16} />
              </button>
            </div>
            {detailError ? <p role="alert" className="m-0 mt-4 text-[12px] text-[#b91c1c]">{detailError}</p> : null}
            {!detail && !detailError ? <div className="mt-4 h-40 animate-pulse rounded-xl bg-[#f8fafc]" aria-label="Loading offer" /> : null}
            {detail ? (
              <>
                <p className="m-0 mt-3 text-[13px] text-[#334155]">{detail.purpose}</p>
                <table className="mt-4 w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-[#8b96ad]">
                      <th className="border-b border-[#eef2f8] py-2 font-semibold">Service provider</th>
                      <th className="border-b border-[#eef2f8] py-2 font-semibold">Answer</th>
                      <th className="border-b border-[#eef2f8] py-2 font-semibold">Answered on</th>
                      <th className="border-b border-[#eef2f8] py-2 text-right font-semibold">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.providers.map((provider) => (
                      <tr key={provider.vendor_id}>
                        <td className="border-b border-[#f4f6fa] py-2.5 font-medium text-[#1d2a43]">{provider.business_name}</td>
                        <td className="border-b border-[#f4f6fa] py-2.5">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${RESPONSE_STYLES[provider.status].className}`}>
                            {RESPONSE_STYLES[provider.status].label}
                          </span>
                        </td>
                        <td className="border-b border-[#f4f6fa] py-2.5 text-[#5b6e92]">{formatOfferDay(provider.responded_at)}</td>
                        <td className="border-b border-[#f4f6fa] py-2.5 text-right tabular-nums text-[#1d2a43]">{provider.bookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
