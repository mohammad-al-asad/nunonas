"use client";

import { useState } from "react";
import { CalendarDays, Megaphone } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { VendorPlatformOffer } from "@/lib/vendor-api";
import { cn } from "@/lib/utils";

function formatDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATE_BADGE: Record<VendorPlatformOffer["state"], string> = {
  live: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-sky-50 text-sky-700",
  ended: "bg-slate-100 text-slate-500",
};

const RESPONSE_TEXT: Record<VendorPlatformOffer["response"], string> = {
  pending: "Waiting for your answer",
  accepted: "You accepted this offer",
  rejected: "You rejected this offer",
};

export function PlatformOffers({
  offers,
  busyId,
  onRespond,
}: {
  offers: VendorPlatformOffer[];
  busyId: string | null;
  onRespond: (offer: VendorPlatformOffer, accept: boolean) => void;
}) {
  const [confirm, setConfirm] = useState<{ offer: VendorPlatformOffer; accept: boolean } | null>(null);
  const pending = offers.filter((offer) => offer.can_respond).length;

  return (
    <section aria-labelledby="platform-offers-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="platform-offers-title" className="text-xl font-bold text-slate-800">Platform offers</h2>
          <p className="mt-1 text-sm text-slate-400">
            Campaigns from the platform. Accepted offers apply automatically to your bookings during the offer period.
          </p>
        </div>
        {pending > 0 ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{pending} waiting for your answer</span>
        ) : null}
      </div>

      {offers.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
          No platform offers right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <article key={offer.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2fb] text-[#1e2a5e]">
                  <Megaphone className="h-5 w-5" />
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider", STATE_BADGE[offer.state])}>
                  {offer.state}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">{offer.name}</h3>
              <p className="mt-1 text-2xl font-black text-[#1e2a5e]">{offer.discount_label}</p>
              <p className="mt-3 flex-1 text-sm text-slate-500">{offer.purpose}</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {formatDay(offer.start_date)} – {formatDay(offer.end_date)}
              </p>
              <div className="mt-5 border-t border-slate-100 pt-4">
                {offer.can_respond ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busyId === offer.id}
                      onClick={() => setConfirm({ offer, accept: true })}
                      className="flex-1 rounded-xl bg-[#1e2a5e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busyId === offer.id}
                      onClick={() => setConfirm({ offer, accept: false })}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "text-sm font-bold",
                      offer.response === "accepted" ? "text-emerald-600" : offer.response === "rejected" ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    {RESPONSE_TEXT[offer.response]}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.accept ? `Join “${confirm.offer.name}”?` : `Reject “${confirm?.offer.name ?? ""}”?`}
        message={
          confirm?.accept
            ? `${confirm.offer.discount_label} will apply to your bookings from ${formatDay(confirm.offer.start_date)} to ${formatDay(confirm.offer.end_date)}. You can't change this later.`
            : "This offer won't run at your business. You can't change this later."
        }
        confirmLabel={confirm?.accept ? "Accept offer" : "Reject offer"}
        destructive={confirm ? !confirm.accept : false}
        busy={confirm !== null && busyId === confirm.offer.id}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          onRespond(confirm.offer, confirm.accept);
          setConfirm(null);
        }}
      />
    </section>
  );
}
