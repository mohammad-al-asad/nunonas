"use client";

import React from "react";
import {
  X,
  Phone,
  Mail,
  CircleCheck,
  MessageSquareQuote,
} from "lucide-react";
import { formatBookingTimestamp } from "./BookingsTable";

export interface HotelBooking {
  id: string;
  backendId?: string;
  customer: {
    name: string;
    avatar: string;
    since: string;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomNumber: string;
  ratePerNight: number;
  serviceFee: number;
  tourismTax: number;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "CHECK IN" | "COMPLETE";
  payment: "Paid" | "Unpaid";
  phone: string;
  email: string;
  specialRequests: string;
  guests: string;
  requestedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  statusNote?: string;
  statusHistory?: Array<{ status?: string; at?: string; actor?: string; label?: string; note?: string }>;
  pointsAwarded?: number;
}

interface HotelBookingDetailsModalProps {
  booking: HotelBooking | null;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}

export function HotelBookingDetailsModal({
  booking,
  onClose,
  onUpdateStatus,
}: HotelBookingDetailsModalProps) {
  if (!booking) return null;
  const status = booking.status.toLowerCase();
  const canConfirm = status === "pending";
  const canCheckIn = status === "confirmed";
  const canComplete = status === "check in";
  const canCancel = status === "pending" || status === "confirmed" || status === "check in";

  const totalAmount =
    booking.nights * booking.ratePerNight +
    booking.serviceFee +
    booking.tourismTax;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="hotel-booking-title">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[480px] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
          <h2 id="hotel-booking-title" className="text-2xl font-black text-slate-800 tracking-tight">
            Booking Details
          </h2>
          <button
            type="button"
            aria-label="Close booking details"
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-2xl transition-all group"
          >
            <X className="h-6 w-6 text-slate-300 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
          {/* Guest Info Section */}
          <div className="space-y-6">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Guest Information
            </span>
            <div className="flex items-center gap-5">
              {booking.customer.avatar ? <img src={booking.customer.avatar} alt={booking.customer.name} className="h-20 w-20 rounded-[32px] border-4 border-slate-50 object-cover shadow-sm" /> : <span className="flex h-20 w-20 items-center justify-center rounded-[32px] border-4 border-slate-50 bg-slate-100 text-xl font-black text-slate-500">{booking.customer.name.slice(0, 1).toUpperCase()}</span>}
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">
                  {booking.customer.name}
                </h3>
                <p className="text-sm font-bold text-slate-400">
                  Customer since {booking.customer.since}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-50 group transition-all">
                <div className="h-10 w-10 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-[#1e2a5e] transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Phone
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {booking.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-50 group transition-all">
                <div className="h-10 w-10 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-[#1e2a5e] transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Email
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {booking.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Booking timeline</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[["Request sent", booking.requestedAt], ["Accepted by provider", booking.acceptedAt], ["Completed", booking.completedAt], ["Cancelled", booking.canceledAt]].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-700">{formatBookingTimestamp(value)}</p>
                </div>
              ))}
            </div>
            {booking.statusNote ? <p className="mt-3 text-xs text-slate-500"><span className="font-black text-slate-700">Provider note:</span> {booking.statusNote}</p> : null}
            {booking.statusHistory?.length ? <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">{booking.statusHistory.map((event, index) => <div key={`${event.status}-${event.at}-${index}`} className="flex items-start justify-between gap-3 text-xs"><span className="font-bold text-slate-700">{event.label ?? `${String(event.status ?? "Status").replaceAll("_", " ")} by ${event.actor === "customer" ? "customer" : "service provider"}`}</span><span className="shrink-0 text-slate-400">{formatBookingTimestamp(event.at)}</span></div>)}</div> : null}
            {booking.pointsAwarded ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Loyalty reward issued</p><p className="mt-1 text-sm font-black text-emerald-800">+{booking.pointsAwarded.toLocaleString()} points awarded after completion</p></div> : null}
          </div>

          {/* Stay Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50/50 rounded-[32px] border border-slate-50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Check-in
              </span>
              <span className="text-sm font-black text-slate-800">
                {booking.checkIn}
              </span>
            </div>
            <div className="p-5 bg-slate-50/50 rounded-[32px] border border-slate-50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Check-out
              </span>
              <span className="text-sm font-black text-slate-800">
                {booking.checkOut}
              </span>
            </div>
          </div>

          {/* Room Assignment */}
          <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-50">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Room Assigned
            </span>
            <span className="text-sm font-black text-slate-800">
              {booking.roomNumber} - {booking.roomType}
            </span>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-4">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-4">
              Price Breakdown
            </span>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-slate-500">
                <span>
                  {booking.nights} Nights x ${booking.ratePerNight}
                </span>
                <span className="text-slate-800">
                  ${(booking.nights * booking.ratePerNight).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-500">
                <span>Service Fee</span>
                <span className="text-slate-800">
                  ${booking.serviceFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-500 pb-4 border-b border-slate-50">
                <span>Tourism Tax</span>
                <span className="text-slate-800">
                  ${booking.tourismTax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black text-slate-800">
                  Total Amount
                </span>
                <span className="text-2xl font-black text-[#3b82f6]">
                  ${totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-[#3b82f6]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">
                Special Requests
              </span>
            </div>
            <div className="p-6 bg-amber-50/40 rounded-[32px] border border-amber-100/50">
              <p className="text-sm font-bold leading-relaxed text-slate-600 italic">
                “{booking.specialRequests}”
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4">
            {canConfirm ? <button type="button" onClick={() => onUpdateStatus("confirmed")} className="flex items-center justify-center py-5 rounded-[24px] bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all">Confirm reservation</button> : null}
            {canCheckIn ? <button type="button" onClick={() => onUpdateStatus("check_in")} className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-[#1e2a5e] text-white font-black text-sm hover:bg-[#1a234d] transition-all shadow-xl shadow-[#1e2a5e]/20"><CircleCheck className="h-5 w-5" />Check-in</button> : null}
            {canComplete ? <button type="button" onClick={() => onUpdateStatus("complete")} className="flex items-center justify-center py-5 rounded-[24px] bg-sky-500 text-white font-black text-sm hover:bg-sky-600 transition-all">Mark complete</button> : null}
            {canCancel ? <button type="button" onClick={() => onUpdateStatus("cancelled")} className="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors py-2">CANCEL RESERVATION</button> : <span className="text-center text-xs font-black uppercase tracking-widest text-slate-300 py-2">NO FURTHER ACTIONS</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
