"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, X } from "lucide-react";
import {
  vendorCreateManualBooking,
  vendorListRooms,
  vendorListServices,
  type ManualBookingPayload,
} from "@/lib/vendor-api";
import { vendorProfileQuery } from "@/lib/vendor-queries";

type ProviderType = ManualBookingPayload["provider_type"];

type Option = { id: string; name: string; price: number; maxGuests?: number };

const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500";
const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

const TITLES: Record<ProviderType, string> = {
  restaurant: "New table booking",
  hotel: "New room booking",
  spa: "New spa appointment",
};

function localDate(offsetDays = 0) {
  const day = new Date();
  day.setDate(day.getDate() + offsetDays);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

/** "19:30" -> "07:30 PM", the format booking slots use. */
function to12Hour(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  const nights = Math.round((new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / 86_400_000);
  return Number.isFinite(nights) ? nights : 0;
}

/**
 * Add a booking for a guest who booked outside the app (walk-in, phone, message).
 * It blocks the table, room or slot like any booking but no commission is charged.
 */
export function ManualBookingModal({
  providerType,
  open,
  onClose,
  onCreated,
}: {
  providerType: ProviderType;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const profileQuery = useQuery(vendorProfileQuery());
  const settings = (profileQuery.data?.[`${providerType}_settings`] ?? {}) as Record<string, unknown>;
  const bookingTimes = Array.isArray(settings.available_booking_times) ? (settings.available_booking_times as string[]) : [];
  const seatingOptions = (Array.isArray(settings.seating_preferences) ? (settings.seating_preferences as string[]) : [])
    .filter((option) => option.trim().toLowerCase() !== "no preference");

  const [options, setOptions] = useState<Option[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: localDate(),
    checkOut: localDate(1),
    time: "",
    guests: "2",
    optionId: "",
    seating: "",
    amount: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || providerType === "restaurant") return;
    let cancelled = false;
    const load = providerType === "hotel"
      ? vendorListRooms().then((result) => (result.items ?? []).map((room) => ({
          id: String(room.id ?? room._id ?? ""),
          name: String(room.name ?? "Room"),
          price: Number(room.base_price ?? 0),
          maxGuests: Number(room.max_guests ?? 0) || undefined,
        })))
      : vendorListServices("spa").then((result) => (result.items ?? [])
          .filter((service) => service.active_status !== false)
          .map((service) => ({ id: String(service.id ?? service._id ?? ""), name: String(service.name ?? "Treatment"), price: Number(service.price ?? 0) })));
    load
      .then((rows) => {
        if (!cancelled) setOptions(rows.filter((row) => row.id));
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, providerType]);

  const selected = options.find((option) => option.id === form.optionId);
  const nights = providerType === "hotel" ? nightsBetween(form.date, form.checkOut) : 0;
  // Suggested price from the room rate or treatment price; the provider can change it.
  const suggestedAmount = useMemo(() => {
    if (!selected) return "";
    if (providerType === "hotel") return nights > 0 ? String(selected.price * nights) : "";
    return String(selected.price);
  }, [selected, providerType, nights]);

  if (!open) return null;

  const update = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const submit = async () => {
    const guests = Number(form.guests);
    const amount = form.amount.trim() === "" ? Number(suggestedAmount || 0) : Number(form.amount);
    if (!form.name.trim()) return setError("Enter the guest's name.");
    if (!form.date) return setError("Choose a date.");
    if (providerType !== "hotel" && !form.time) return setError("Choose a time.");
    if (providerType === "hotel" && !form.optionId) return setError("Choose a room type.");
    if (providerType === "hotel" && nights < 1) return setError("Check-out must be after check-in.");
    if (!Number.isInteger(guests) || guests < 1) return setError("Enter the number of guests.");
    if (!Number.isFinite(amount) || amount < 0) return setError("Enter a valid amount.");

    setSaving(true);
    setError("");
    try {
      await vendorCreateManualBooking({
        provider_type: providerType,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim() || undefined,
        customer_email: form.email.trim() || undefined,
        date: form.date,
        time: form.time || undefined,
        guests,
        total_amount: amount,
        room_id: providerType === "hotel" ? form.optionId : undefined,
        check_out_date: providerType === "hotel" ? form.checkOut : undefined,
        service_id: providerType === "spa" && form.optionId ? form.optionId : undefined,
        seating_preference: form.seating || undefined,
        special_requests: form.notes.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-booking-title"
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="manual-booking-title" className="text-lg font-black text-slate-800">{TITLES[providerType]}</h2>
            <p className="mt-1 text-xs text-slate-500">For walk-in, phone or message bookings made outside the app.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Manual bookings hold the {providerType === "hotel" ? "room" : providerType === "spa" ? "time slot" : "table"} so app customers can&apos;t double-book it. No commission is charged on them.
          </p>

          <label className="block">
            <span className={labelClass}>Guest name</span>
            <input value={form.name} onChange={(event) => update({ name: event.target.value })} maxLength={120} className={inputClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Phone (optional)</span>
              <input value={form.phone} onChange={(event) => update({ phone: event.target.value })} inputMode="tel" maxLength={40} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Email (optional)</span>
              <input value={form.email} onChange={(event) => update({ email: event.target.value })} type="email" maxLength={200} className={inputClass} />
            </label>
          </div>

          {providerType === "hotel" ? (
            <>
              <label className="block">
                <span className={labelClass}>Room type</span>
                <select value={form.optionId} onChange={(event) => update({ optionId: event.target.value })} className={inputClass}>
                  <option value="">{options.length ? "Choose a room type" : "No rooms added yet"}</option>
                  {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Check-in</span>
                  <input type="date" value={form.date} onChange={(event) => update({ date: event.target.value })} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Check-out</span>
                  <input type="date" value={form.checkOut} min={form.date} onChange={(event) => update({ checkOut: event.target.value })} className={inputClass} />
                </label>
              </div>
            </>
          ) : (
            <>
              {providerType === "spa" ? (
                <label className="block">
                  <span className={labelClass}>Treatment (optional)</span>
                  <select value={form.optionId} onChange={(event) => update({ optionId: event.target.value })} className={inputClass}>
                    <option value="">Not specified</option>
                    {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                </label>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Date</span>
                  <input type="date" value={form.date} onChange={(event) => update({ date: event.target.value })} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Time</span>
                  <input type="time" onChange={(event) => update({ time: to12Hour(event.target.value) })} className={inputClass} />
                </label>
              </div>
              {bookingTimes.length ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Your booking times">
                  {bookingTimes.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => update({ time: slot })}
                      aria-pressed={form.time === slot}
                      className={form.time === slot
                        ? "rounded-full bg-[#1e2a5e] px-3 py-1.5 text-xs font-bold text-white"
                        : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : null}
              {form.time ? <p className="text-xs text-slate-500">Selected time: <span className="font-bold text-slate-700">{form.time}</span></p> : null}
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Guests</span>
              <input
                type="number"
                min={1}
                max={selected?.maxGuests ?? 100}
                value={form.guests}
                onChange={(event) => update({ guests: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Amount (optional)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                placeholder={suggestedAmount || "0.00"}
                onChange={(event) => update({ amount: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          {providerType === "restaurant" && seatingOptions.length ? (
            <label className="block">
              <span className={labelClass}>Seating (optional)</span>
              <select value={form.seating} onChange={(event) => update({ seating: event.target.value })} className={inputClass}>
                <option value="">No preference</option>
                {seatingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className={labelClass}>Notes (optional)</span>
            <textarea value={form.notes} onChange={(event) => update({ notes: event.target.value })} rows={2} maxLength={2000} className={inputClass} />
          </label>

          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="rounded-xl bg-[#1e2a5e] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
