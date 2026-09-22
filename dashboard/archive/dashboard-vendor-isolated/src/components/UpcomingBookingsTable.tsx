"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { vendorGetUpcomingBookings } from "@/lib/vendor-api";

interface Booking {
  id?: string;
  _id?: string;
  customer_name?: string;
  customer?: string;
  date?: string;
  time?: string;
  guests?: number;
  status?: string;
}

export function UpcomingBookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorGetUpcomingBookings(10)
      .then((data) => {
        const raw = data as { items?: Booking[]; bookings?: Booking[] };
        setBookings(raw?.items ?? raw?.bookings ?? []);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-800">Upcoming Bookings</h3>
        <button className="text-sm font-semibold text-sky-500 hover:text-sky-600 transition-colors">
          View All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-slate-400 py-10">No upcoming bookings</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Time</th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Guests</th>
                <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((booking, idx) => (
                <tr key={booking.id ?? booking._id ?? idx} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-sm font-bold text-slate-800">
                    {booking.customer_name ?? booking.customer ?? "—"}
                  </td>
                  <td className="py-4 text-sm text-slate-500">{booking.date ?? "—"}</td>
                  <td className="py-4 text-sm text-slate-500">{booking.time ?? "—"}</td>
                  <td className="py-4 text-sm text-slate-500">{booking.guests ?? "—"}</td>
                  <td className="py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold",
                        booking.status === "confirmed"
                          ? "bg-sky-50 text-sky-500"
                          : booking.status === "pending"
                            ? "bg-amber-50 text-amber-500"
                            : "bg-slate-50 text-slate-500",
                      )}
                    >
                      {booking.status ?? "pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
