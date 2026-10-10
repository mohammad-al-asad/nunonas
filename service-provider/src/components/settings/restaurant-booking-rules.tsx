"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// The customer booking API accepts at most 20 guests per table booking.
const MAX_PARTY_SIZE = 20;

export type RestaurantBookingRules = {
  booking_capacity: string;
  max_guests: string;
  closed_days: string[];
  blocked_dates: string[];
};

const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500";
const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** Restaurant table booking limits and closures, enforced by the customer app and booking API. */
export function RestaurantBookingRulesEditor({
  value,
  onChange,
}: {
  value: RestaurantBookingRules;
  onChange: (value: RestaurantBookingRules) => void;
}) {
  const [blockedDate, setBlockedDate] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const upcomingBlocked = value.blocked_dates.filter((date) => date >= today);

  const toggleDay = (day: string) => {
    const closed = value.closed_days.includes(day)
      ? value.closed_days.filter((item) => item !== day)
      : [...value.closed_days, day];
    onChange({ ...value, closed_days: WEEKDAYS.filter((item) => closed.includes(item)) });
  };

  const addBlockedDate = () => {
    if (!blockedDate || value.blocked_dates.includes(blockedDate)) return;
    // Past dates no longer matter, so they are dropped whenever the list changes.
    onChange({ ...value, blocked_dates: [...upcomingBlocked, blockedDate].sort() });
    setBlockedDate("");
  };

  return (
    <section aria-label="Table booking rules" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Bookings per time slot</span>
          <input
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            value={value.booking_capacity}
            onChange={(event) => onChange({ ...value, booking_capacity: event.target.value })}
            placeholder="10"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-slate-400">A time slot shows as full after this many bookings. Default 10.</span>
        </label>
        <label className="block">
          <span className={labelClass}>Maximum guests per booking</span>
          <input
            type="number"
            min={1}
            max={MAX_PARTY_SIZE}
            inputMode="numeric"
            value={value.max_guests}
            onChange={(event) => onChange({ ...value, max_guests: event.target.value })}
            placeholder={String(MAX_PARTY_SIZE)}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-slate-400">Up to {MAX_PARTY_SIZE}. Leave empty to allow the full {MAX_PARTY_SIZE}.</span>
        </label>
      </div>

      <div>
        <span className={labelClass}>Closed days</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Closed days">
          {WEEKDAYS.map((day) => {
            const closed = value.closed_days.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={closed}
                onClick={() => toggleDay(day)}
                className={
                  closed
                    ? "rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200"
                    : "rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
                }
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
        <span className="mt-1 block text-xs text-slate-400">Customers can&apos;t book a table on the highlighted days.</span>
      </div>

      <div>
        <span className={labelClass}>Blocked dates</span>
        <div className="mt-2 flex min-h-8 flex-wrap gap-2">
          {upcomingBlocked.length ? upcomingBlocked.map((date) => (
            <span key={date} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
              {formatDate(date)}
              <button
                type="button"
                onClick={() => onChange({ ...value, blocked_dates: upcomingBlocked.filter((item) => item !== date) })}
                aria-label={`Remove ${formatDate(date)}`}
                className="rounded-full p-0.5 text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )) : (
            <span className="text-xs text-slate-400">No blocked dates. Add holidays or private events.</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <input
            type="date"
            min={today}
            value={blockedDate}
            onChange={(event) => setBlockedDate(event.target.value)}
            aria-label="Date to block"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="button"
            onClick={addBlockedDate}
            disabled={!blockedDate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e2a5e] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Block date
          </button>
        </div>
      </div>
    </section>
  );
}
