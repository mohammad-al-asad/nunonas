"use client";

import React from "react";
import { Check, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HotelBooking } from "./HotelBookingDetailsModal";

interface HotelBookingsTableProps {
  bookings: HotelBooking[];
  onViewDetails: (booking: HotelBooking) => void;
}

export function HotelBookingsTable({
  bookings,
  onViewDetails,
}: HotelBookingsTableProps) {
  return (
    <div className="rounded-2xl bg-white p-4 md:p-8 shadow-sm border border-slate-100 mb-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Booking ID
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer Name
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date & Time
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Guests
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Room Type
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Status
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Payment
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.map((booking, idx) => (
              <tr
                key={idx}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-5 font-bold text-sky-500 text-sm whitespace-nowrap">
                  {booking.id}
                </td>
                <td className="py-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={booking.customer.avatar}
                      alt={booking.customer.name}
                      className="h-10 w-10 rounded-full border-2 border-slate-100"
                    />
                    <span className="font-bold text-slate-700 text-sm">
                      {booking.customer.name}
                    </span>
                  </div>
                </td>
                <td className="py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">
                      {booking.checkIn.split(",")[0]} -{" "}
                      {booking.checkOut.split(",")[0]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {booking.nights} Nights
                    </span>
                  </div>
                </td>
                <td className="py-5 text-center font-bold text-slate-700 text-sm">
                  {booking.guests}
                </td>
                <td className="py-5 text-slate-500 text-sm">
                  {booking.roomType}
                </td>
                <td className="py-5">
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                        booking.status === "CONFIRMED" &&
                          "bg-emerald-50 text-emerald-500",
                        booking.status === "PENDING" &&
                          "bg-amber-50 text-amber-500",
                        booking.status === "CANCELLED" &&
                          "bg-rose-50 text-rose-500",
                        booking.status === "CHECK IN" &&
                          "bg-[#1e2a5e] text-white",
                        booking.status === "COMPLETE" &&
                          "bg-sky-500 text-white",
                      )}
                    >
                      {booking.status}
                    </span>
                  </div>
                </td>
                <td className="py-5">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      booking.payment === "Paid"
                        ? "text-emerald-500"
                        : "text-slate-300",
                    )}
                  >
                    {booking.payment}
                  </span>
                </td>
                <td className="py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all">
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-sky-500 hover:text-white transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
