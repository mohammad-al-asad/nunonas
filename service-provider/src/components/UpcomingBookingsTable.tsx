"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface UpcomingBooking {
  id?: string;
  _id?: string;
  customer_name?: string;
  customer?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  date?: string;
  time?: string;
  guest_count?: number;
  guests?: number;
  status?: string;
  payment_status?: string;
  payment?: string;
}

export function UpcomingBookingsTable({ bookings = [], viewAllHref = "/restaurant-bookings" }: { bookings?: UpcomingBooking[]; viewAllHref?: string }) {
  return (
    <section aria-labelledby="upcoming-bookings-title" className="h-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h3 id="upcoming-bookings-title" className="text-lg font-bold text-slate-800">Upcoming Bookings</h3>
        <Link href={viewAllHref} className="text-sm font-semibold text-sky-500 transition-colors hover:text-sky-600">View All</Link>
      </div>
      {bookings.length === 0 ? (
        <div className="py-10 text-center text-slate-400">No upcoming bookings</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead><tr className="border-b border-slate-50">
              {['Customer', 'Date', 'Time', 'Guests', 'Status'].map((label) => <th key={label} className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((booking, index) => (
                <tr key={booking.id ?? booking._id ?? index} className="group transition-colors hover:bg-slate-50/50">
                  <td className="py-4 text-sm font-bold text-slate-800">{booking.customer_name ?? booking.customer ?? "—"}</td>
                  <td className="py-4 text-sm text-slate-500">{booking.date ?? booking.scheduled_date ?? "—"}</td>
                  <td className="py-4 text-sm text-slate-500">{booking.time ?? booking.scheduled_time ?? "—"}</td>
                  <td className="py-4 text-sm text-slate-500">{booking.guests ?? booking.guest_count ?? "—"}</td>
                  <td className="py-4"><span className={cn("inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold", booking.status === "confirmed" ? "bg-sky-50 text-sky-500" : booking.status === "pending" ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-500")}>{booking.status ?? "pending"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
