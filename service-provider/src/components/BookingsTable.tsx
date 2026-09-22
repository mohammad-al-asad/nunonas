"use client";

import React from "react";
import Image from "next/image";
import { Check, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatBookingTimestamp(value?: string) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export interface Booking {
  id: string;
  backendId?: string;
  customer: {
    name: string;
    avatar: string;
  };
  date: string;
  time: string;
  guests: number;
  service: string;
  status: string;
  payment: string;
  phone?: string;
  email?: string;
  specialRequests?: string;
  customerSince?: string;
  requestedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  statusNote?: string;
  statusHistory?: Array<{ status?: string; at?: string; actor?: string; label?: string; note?: string }>;
  pointsAwarded?: number;
}

interface BookingsTableProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
  onUpdateStatus: (booking: Booking, status: string) => void;
}

export function BookingsTable({ bookings, onViewDetails, onUpdateStatus }: BookingsTableProps) {
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
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center md:text-left">
                Date & Time
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Guests
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Service
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Status
              </th>
              <th className="pb-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Payment
              </th>
              <th className="w-[150px] pb-6 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                    {booking.customer.avatar ? <Image src={booking.customer.avatar} alt="" width={40} height={40} sizes="40px" className="h-10 w-10 rounded-full border-2 border-slate-100 object-cover" /> : <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 bg-slate-100 text-xs font-black text-slate-500">{booking.customer.name.slice(0, 1).toUpperCase()}</span>}
                    <span className="font-bold text-slate-700 text-sm">
                      {booking.customer.name}
                    </span>
                  </div>
                </td>
                <td className="py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">
                      {booking.date}
                    </span>
                    <span className="text-xs text-slate-400">
                      {booking.time}
                    </span>
                  </div>
                </td>
                <td className="py-5 text-center font-bold text-slate-700 text-sm">
                  {booking.guests}
                </td>
                <td className="py-5 text-slate-500 text-sm">
                  {booking.service}
                </td>
                <td className="py-5">
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                        booking.status === "Confirmed" &&
                          "bg-emerald-50 text-emerald-500",
                        booking.status === "Pending" &&
                          "bg-amber-50 text-amber-500",
                        booking.status === "Cancelled" &&
                          "bg-rose-50 text-rose-500",
                        booking.status === "Complete" &&
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
                <td className="w-[150px] py-5 text-center">
                  <div className="flex justify-center gap-2">
                    {booking.status === "Pending" ? <button onClick={() => onUpdateStatus(booking, "confirmed")} aria-label="Confirm booking" className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"><Check className="h-4 w-4" /></button> : null}
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-sky-500 hover:text-white transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {booking.status === "Pending" || booking.status === "Confirmed" ? <button onClick={() => onUpdateStatus(booking, "cancelled")} aria-label="Cancel booking" className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all"><X className="h-4 w-4" /></button> : null}
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
