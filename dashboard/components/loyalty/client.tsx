"use client";

import { useState } from "react";
import { FiAward, FiCheck, FiSave, FiX } from "react-icons/fi";
import {
  type LoyaltyConfig,
  type LoyaltyProvider,
  type LoyaltyStatus,
  formatLoyaltyDate,
} from "@/lib/loyalty";

type Draft = Record<keyof Omit<LoyaltyConfig, "updated_at">, string>;

const STATUS_STYLES: Record<LoyaltyStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[#fff7ed] text-[#c2410c]" },
  active: { label: "Active", className: "bg-[#ecfdf5] text-[#047857]" },
  rejected: { label: "Declined", className: "bg-[#fef2f2] text-[#b91c1c]" },
  off: { label: "Turned off", className: "bg-[#f1f5f9] text-[#475569]" },
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-[#e6ecf7] bg-white px-3 py-2.5 text-[13px] text-[#1f2d46] outline-none focus:border-[#1f3d8f]";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-[#6c7890]";

function toDraft(config: LoyaltyConfig): Draft {
  return {
    points_rule_type: config.points_rule_type,
    points_earned: String(config.points_earned),
    currency_unit: String(config.currency_unit),
    percentage_value: String(config.percentage_value),
    first_booking_bonus: String(config.first_booking_bonus),
    review_bonus_points: String(config.review_bonus_points),
    points_expiry_policy: config.points_expiry_policy,
  };
}

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { detail?: unknown };
  return typeof payload.detail === "string" ? payload.detail : fallback;
}

export function LoyaltyManagementView({
  config: initialConfig,
  providers: initialProviders,
  minActiveDays,
}: {
  config: LoyaltyConfig;
  providers: LoyaltyProvider[];
  minActiveDays: number;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initialConfig));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [providers, setProviders] = useState(initialProviders);
  const [busyVendor, setBusyVendor] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<LoyaltyProvider | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [listError, setListError] = useState("");

  const pending = providers.filter((provider) => provider.status === "pending");
  const others = providers.filter((provider) => provider.status !== "pending");
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(config));

  const update = (key: keyof Draft, value: string) => {
    setMessage(null);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveConfig = async () => {
    const numbers = {
      points_earned: Number(draft.points_earned),
      currency_unit: Number(draft.currency_unit),
      percentage_value: Number(draft.percentage_value),
      first_booking_bonus: Number(draft.first_booking_bonus),
      review_bonus_points: Number(draft.review_bonus_points),
    };
    if (Object.values(numbers).some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage({ tone: "error", text: "Enter numbers of 0 or more." });
      return;
    }
    if (draft.points_rule_type === "points_per_currency" && numbers.currency_unit <= 0) {
      setMessage({ tone: "error", text: "The amount spent must be more than 0." });
      return;
    }
    if (numbers.percentage_value > 100) {
      setMessage({ tone: "error", text: "The percentage can't be more than 100." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/loyalty/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...numbers,
          first_booking_bonus: Math.round(numbers.first_booking_bonus),
          review_bonus_points: Math.round(numbers.review_bonus_points),
          points_rule_type: draft.points_rule_type,
          points_expiry_policy: draft.points_expiry_policy,
        }),
      });
      if (!response.ok) throw new Error(await readError(response, "Could not save the loyalty rules."));
      const saved = (await response.json()) as LoyaltyConfig;
      setConfig(saved);
      setDraft(toDraft(saved));
      setMessage({ tone: "ok", text: "Loyalty rules saved. They apply to new points from now on." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save the loyalty rules." });
    } finally {
      setSaving(false);
    }
  };

  const review = async (provider: LoyaltyProvider, action: "approve" | "reject", reason?: string) => {
    setBusyVendor(provider.vendor_id);
    setListError("");
    try {
      const response = await fetch(`/api/loyalty/providers/${provider.vendor_id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: reason?.trim() || null } : {}),
      });
      if (!response.ok) throw new Error(await readError(response, "Could not update this request."));
      const updated = (await response.json()) as Partial<LoyaltyProvider>;
      setProviders((current) =>
        current.map((row) => (row.vendor_id === provider.vendor_id ? { ...row, ...updated } : row)),
      );
      setRejecting(null);
      setRejectReason("");
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Could not update this request.");
    } finally {
      setBusyVendor(null);
    }
  };

  const percentage = draft.points_rule_type === "percentage_based";

  return (
    <section className="space-y-4">
      {/* Rules */}
      <section className="rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-[15px] font-semibold text-[#1d2a43]">
              <FiAward className="text-[#1f3d8f]" /> Loyalty rules
            </h2>
            <p className="m-0 mt-1 text-[12px] text-[#6c7890]">
              One set of rules for every provider in the program. Last updated {formatLoyaltyDate(config.updated_at)}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void saveConfig()}
            disabled={saving || !dirty}
            className="flex items-center gap-2 rounded-xl bg-[#1f3d8f] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            <FiSave size={14} /> {saving ? "Saving..." : "Save rules"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className={labelClass}>How points are earned</span>
            <select value={draft.points_rule_type} onChange={(event) => update("points_rule_type", event.target.value)} className={fieldClass}>
              <option value="points_per_currency">Points per amount spent</option>
              <option value="percentage_based">Percentage of booking amount</option>
            </select>
          </label>
          {percentage ? (
            <label className="block">
              <span className={labelClass}>Percentage (%)</span>
              <input type="number" min={0} max={100} step="0.1" value={draft.percentage_value} onChange={(event) => update("percentage_value", event.target.value)} className={fieldClass} />
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Points</span>
                <input type="number" min={0} step="0.1" value={draft.points_earned} onChange={(event) => update("points_earned", event.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Per amount</span>
                <input type="number" min={0} step="1" value={draft.currency_unit} onChange={(event) => update("currency_unit", event.target.value)} className={fieldClass} />
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>First booking bonus</span>
              <input type="number" min={0} step="1" value={draft.first_booking_bonus} onChange={(event) => update("first_booking_bonus", event.target.value)} className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Review bonus</span>
              <input type="number" min={0} step="1" value={draft.review_bonus_points} onChange={(event) => update("review_bonus_points", event.target.value)} className={fieldClass} />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Points expire</span>
            <select value={draft.points_expiry_policy} onChange={(event) => update("points_expiry_policy", event.target.value)} className={fieldClass}>
              <option value="1 Year">After 1 year</option>
              <option value="2 Years">After 2 years</option>
              <option value="No Expiry">Never</option>
            </select>
          </label>
        </div>
        <p className="m-0 mt-3 text-[12px] text-[#6c7890]">
          {percentage
            ? `Customers earn ${draft.percentage_value || 0}% of each completed booking's amount in points.`
            : `Customers earn ${draft.points_earned || 0} point(s) for every ${draft.currency_unit || 0} spent on completed bookings.`}{" "}
          Providers must keep the program on for at least {minActiveDays} days after approval.
        </p>
        {message ? (
          <p className={`m-0 mt-3 text-[12px] font-semibold ${message.tone === "ok" ? "text-[#047857]" : "text-[#dc2626]"}`}>{message.text}</p>
        ) : null}
      </section>

      {/* Requests */}
      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-[#e6ecf7] px-5 py-4">
          <div>
            <h2 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Providers</h2>
            <p className="m-0 mt-1 text-[12px] text-[#6c7890]">
              {pending.length ? `${pending.length} request${pending.length === 1 ? "" : "s"} waiting for review.` : "No requests waiting for review."}
            </p>
          </div>
        </header>
        {listError ? <p className="m-0 border-b border-[#e6ecf7] bg-[#fef2f2] px-5 py-3 text-[12px] font-semibold text-[#b91c1c]">{listError}</p> : null}
        {providers.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-[13px] text-[#6c7890]">No provider has asked to join the loyalty program yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#6c7890]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Provider</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Requested</th>
                  <th className="px-5 py-3 font-semibold">Active since</th>
                  <th className="px-5 py-3 font-semibold">Can turn off from</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7] text-[13px] text-[#1f2d46]">
                {[...pending, ...others].map((provider) => {
                  const style = STATUS_STYLES[provider.status];
                  return (
                    <tr key={provider.vendor_id}>
                      <td className="px-5 py-3">
                        <p className="m-0 font-semibold">{provider.business_name}</p>
                        <p className="m-0 mt-0.5 text-[11px] text-[#6c7890]">{provider.categories.join(", ") || provider.email || ""}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.className}`}>{style.label}</span>
                        {provider.status === "rejected" && provider.rejection_reason ? (
                          <p className="m-0 mt-1 max-w-[220px] truncate text-[11px] text-[#6c7890]" title={provider.rejection_reason}>{provider.rejection_reason}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">{formatLoyaltyDate(provider.requested_at)}</td>
                      <td className="px-5 py-3">{provider.status === "active" ? formatLoyaltyDate(provider.approved_at) : "-"}</td>
                      <td className="px-5 py-3">{provider.status === "active" ? formatLoyaltyDate(provider.can_turn_off_at) : "-"}</td>
                      <td className="px-5 py-3 text-right">
                        {provider.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={busyVendor === provider.vendor_id}
                              onClick={() => void review(provider, "approve")}
                              className="flex items-center gap-1 rounded-lg bg-[#047857] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                            >
                              <FiCheck size={13} /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyVendor === provider.vendor_id}
                              onClick={() => { setRejecting(provider); setRejectReason(""); }}
                              className="flex items-center gap-1 rounded-lg border border-[#fecaca] px-3 py-1.5 text-[12px] font-semibold text-[#b91c1c] disabled:opacity-50"
                            >
                              <FiX size={13} /> Decline
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rejecting ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejecting(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="loyalty-reject-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 id="loyalty-reject-title" className="m-0 text-[15px] font-semibold text-[#1d2a43]">Decline {rejecting.business_name}?</h3>
            <p className="m-0 mt-1 text-[12px] text-[#6c7890]">The provider is notified and can send a new request later.</p>
            <label className="mt-4 block">
              <span className={labelClass}>Reason (optional, shown to the provider)</span>
              <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} maxLength={500} rows={3} className={fieldClass} />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className="rounded-xl px-4 py-2 text-[12px] font-semibold text-[#475569]">Cancel</button>
              <button
                type="button"
                disabled={busyVendor === rejecting.vendor_id}
                onClick={() => void review(rejecting, "reject", rejectReason)}
                className="rounded-xl bg-[#b91c1c] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Decline request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
