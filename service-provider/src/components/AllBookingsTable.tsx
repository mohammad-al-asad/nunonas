"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardBooking = {
  id?: string;
  _id?: string;
  booking_code?: string;
  customer_name?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  guest_count?: number;
  quantity?: number;
  guests?: number;
  provider_type?: string;
  booking_type?: string;
  service?: string;
  status?: string;
  payment_status?: string;
  payment?: string;
};

function serviceLabel(booking: DashboardBooking) {
  const value = String(booking.provider_type || booking.booking_type || booking.service || "Other").toLowerCase();
  if (value.includes("restaurant") || value.includes("dining") || value.includes("table")) return "Table Booking";
  if (value.includes("hotel") || value.includes("room")) return "Hotel";
  if (value.includes("spa")) return "Spa";
  if (value.includes("event")) return "Event";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bookingPath(booking: DashboardBooking) {
  const value = String(booking.provider_type || booking.booking_type || booking.service || "").toLowerCase();
  if (value.includes("hotel") || value.includes("room")) return "/hotel-bookings";
  if (value.includes("spa")) return "/spa-bookings";
  if (value.includes("event")) return "/events";
  return "/restaurant-bookings";
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "complete" || value === "completed") return "bg-sky-50 text-sky-500";
  if (value === "cancelled" || value === "canceled") return "bg-rose-50 text-rose-500";
  if (value === "confirmed") return "bg-emerald-50 text-emerald-500";
  return "bg-amber-50 text-amber-500";
}

export function AllBookingsTable({ bookings = [] }: { bookings?: DashboardBooking[] }) {
  return (
    <section aria-labelledby="all-bookings-title" className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 id="all-bookings-title" className="text-lg font-bold text-slate-800">Bookings</h3>
          <p className="mt-1 text-sm text-slate-400">All current-month bookings across your services.</p>
        </div>
        <Link href="/analytics" prefetch={false} className="text-sm font-semibold text-sky-500">View analytics</Link>
      </div>
      {bookings.length === 0 ? (
        <div className="py-10 text-center text-slate-400">No bookings this month</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead><tr className="border-b border-slate-50">
              {['Booking', 'Customer', 'Date / Time', 'Qty', 'Service', 'Status', 'Payment', ''].map((label) => <th key={label} className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((booking, index) => {
                const id = String(booking.id || booking._id || "");
                const status = String(booking.status || "pending");
                return (
                  <tr key={id || index} className="group transition-colors hover:bg-slate-50/50">
                    <td className="py-4 text-sm font-bold text-sky-500">{booking.booking_code || `#${id.slice(-6) || "Booking"}`}</td>
                    <td className="py-4 text-sm font-bold text-slate-800">{booking.customer_name || "—"}</td>
                    <td className="py-4"><div className="text-sm font-bold text-slate-700">{booking.scheduled_date || "—"}</div><div className="text-xs text-slate-400">{booking.scheduled_time || "—"}</div></td>
                    <td className="py-4 text-sm font-bold text-slate-700">{booking.quantity ?? booking.guests ?? booking.guest_count ?? "—"}</td>
                    <td className="py-4 text-sm text-slate-500">{serviceLabel(booking)}</td>
                    <td className="py-4"><span className={cn("inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold uppercase", statusClass(status))}>{status}</span></td>
                    <td className="py-4 text-sm font-bold capitalize text-slate-400">{booking.payment_status || booking.payment || "Unpaid"}</td>
                    <td className="py-4"><Link href={`${bookingPath(booking)}?booking=${encodeURIComponent(id)}`} aria-label={`View ${booking.booking_code || "booking"}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-sky-50 hover:text-sky-500"><Eye className="h-4 w-4" /></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
