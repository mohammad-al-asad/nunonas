"use client";

import { useMemo, useState } from "react";
import { FiPercent, FiSave } from "react-icons/fi";
import { type CommissionModel, type CommissionRates, describeRate, formatDate } from "@/lib/billing";

type Draft = Record<string, { model: CommissionModel; value: string }>;

function toDraft(rates: CommissionRates): Draft {
  return Object.fromEntries(rates.categories.map((rate) => [rate.key, { model: rate.model, value: String(rate.value) }]));
}

export function CommissionRatesPanel({
  rates,
  onSaved,
}: {
  rates: CommissionRates;
  onSaved: (rates: CommissionRates) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(rates));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const errors = useMemo(() => {
    const result: Record<string, string> = {};
    for (const rate of rates.categories) {
      const entry = draft[rate.key];
      const value = Number(entry?.value);
      if (entry?.value === "" || !Number.isFinite(value) || value < 0) result[rate.key] = "Enter a number of 0 or more";
      else if (entry.model === "percentage" && value > 100) result[rate.key] = "Can't be more than 100%";
    }
    return result;
  }, [draft, rates.categories]);

  const dirty = rates.categories.some((rate) => {
    const entry = draft[rate.key];
    return entry && (entry.model !== rate.model || Number(entry.value) !== rate.value);
  });

  const update = (key: string, patch: Partial<Draft[string]>) => {
    setMessage(null);
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const save = async () => {
    if (Object.keys(errors).length) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: rates.categories.map((rate) => ({
            key: rate.key,
            model: draft[rate.key].model,
            value: Number(draft[rate.key].value),
          })),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as CommissionRates & { detail?: string };
      if (!response.ok) throw new Error(payload.detail || "Couldn't save the commission rates.");
      setDraft(toDraft(payload));
      onSaved(payload);
      setMessage({ tone: "ok", text: "Saved. New rates apply to bookings made from now on." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Couldn't save the commission rates." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-[15px] font-semibold text-[#1d2a43]">
            <FiPercent size={14} className="text-[#1f3d8f]" />
            Commission rates
          </h3>
          <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">
            Charged on completed bookings. A percentage applies to the booking subtotal after discounts; a per-lead fee
            applies once per completed booking. Each booking keeps the rate active when it was made.
            {rates.effectiveFrom ? ` Current rates since ${formatDate(rates.effectiveFrom)}.` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || Object.keys(errors).length > 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          <FiSave size={12} />
          {saving ? "Saving..." : "Save rates"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rates.categories.map((rate) => {
          const entry = draft[rate.key] ?? { model: rate.model, value: String(rate.value) };
          const error = errors[rate.key];
          return (
            <div key={rate.key} className="rounded-xl border border-[#edf1fa] bg-[#f8fafc] p-3">
              <p className="m-0 text-[12px] font-semibold text-[#1f2d46]">{rate.label}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-[#e9eef8] p-0.5" role="radiogroup" aria-label={`${rate.label} commission type`}>
                {(["percentage", "per_lead"] as const).map((model) => (
                  <button
                    key={model}
                    type="button"
                    role="radio"
                    aria-checked={entry.model === model}
                    onClick={() => update(rate.key, { model })}
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                      entry.model === model ? "bg-white text-[#1f3d8f] shadow-sm" : "text-[#64748b]"
                    }`}
                  >
                    {model === "percentage" ? "Percentage" : "Per lead"}
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                {entry.model === "per_lead" && (
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#94a3b8]">$</span>
                )}
                <input
                  type="number"
                  min={0}
                  max={entry.model === "percentage" ? 100 : undefined}
                  step={entry.model === "percentage" ? 0.1 : 0.01}
                  value={entry.value}
                  onChange={(event) => update(rate.key, { value: event.target.value })}
                  aria-label={`${rate.label} commission ${entry.model === "percentage" ? "percentage" : "fee per lead"}`}
                  aria-invalid={Boolean(error)}
                  className={`h-9 w-full rounded-lg border bg-white text-[12px] text-[#1f2d46] outline-none focus:border-[#1f3d8f] ${
                    entry.model === "per_lead" ? "pl-6 pr-3" : "pl-3 pr-8"
                  } ${error ? "border-[#ef4444]" : "border-[#dbe2ef]"}`}
                />
                {entry.model === "percentage" && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#94a3b8]">%</span>
                )}
              </div>
              <p className={`m-0 mt-1.5 text-[10px] ${error ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
                {error || describeRate(entry.model, Number(entry.value) || 0)}
              </p>
            </div>
          );
        })}
      </div>

      {message && (
        <p className={`m-0 mt-3 text-[11px] ${message.tone === "ok" ? "text-[#15803d]" : "text-[#ef4444]"}`}>{message.text}</p>
      )}
    </section>
  );
}
