"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Booking, formatBookingTimestamp } from "./BookingsTable";
import { cn } from "@/lib/utils";

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  onReschedule: (date: string, time: string) => void;
  onGenerateReceipt: () => void;
}

export function BookingDetailsModal({
  booking,
  onClose,
  onUpdateStatus,
  onReschedule,
  onGenerateReceipt,
}: BookingDetailsModalProps) {
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  if (!booking) return null;
  const status = booking.status.toLowerCase();
  const canConfirm = status === "pending";
  const canComplete = status === "confirmed" || status === "check in";
  const canCancel = status === "pending" || status === "confirmed" || status === "check in";
  const canReschedule = canCancel;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div role="dialog" aria-modal="true" aria-labelledby="booking-details-title" className="relative flex w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-br from-sky-50/80 via-white to-white px-6 py-6 sm:px-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500 mb-1 block">
              Booking Details
            </span>
            <h2 id="booking-details-title" className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {booking.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking details"
            className="rounded-xl p-2 transition-all hover:bg-white hover:shadow-sm group"
          >
            <X className="h-6 w-6 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-7 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
          {/* Status & Time Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 md:col-span-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide",
                booking.status === "Confirmed" &&
                  "bg-emerald-50 text-emerald-600",
                booking.status === "Pending" && "bg-amber-50 text-amber-600",
                booking.status === "Cancelled" && "bg-rose-50 text-rose-600",
                booking.status === "Complete" && "bg-sky-50 text-sky-600",
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  booking.status === "Confirmed" && "bg-emerald-500",
                  booking.status === "Pending" && "bg-amber-500",
                  booking.status === "Cancelled" && "bg-rose-500",
                  booking.status === "Complete" && "bg-sky-500",
                )}
              />
              {booking.status}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {booking.date} {booking.time ? `· ${booking.time}` : ""}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Booking timeline</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["Request sent", booking.requestedAt], ["Accepted by provider", booking.acceptedAt], ["Completed", booking.completedAt], ["Cancelled", booking.canceledAt]].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-700">{formatBookingTimestamp(value)}</p>
                </div>
              ))}
            </div>
            {booking.statusNote ? <p className="mt-3 text-xs text-slate-500"><span className="font-black text-slate-700">Provider note:</span> {booking.statusNote}</p> : null}
            {booking.statusHistory?.length ? <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">{booking.statusHistory.map((event, index) => <div key={`${event.status}-${event.at}-${index}`} className="flex items-start justify-between gap-3 text-xs"><span className="font-bold text-slate-700">{event.label ?? `${String(event.status ?? "Status").replaceAll("_", " ")} by ${event.actor === "customer" ? "customer" : "service provider"}`}</span><span className="shrink-0 text-slate-400">{formatBookingTimestamp(event.at)}</span></div>)}</div> : null}
            {booking.pointsAwarded ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Loyalty reward issued</p><p className="mt-1 text-sm font-black text-emerald-800">+{booking.pointsAwarded.toLocaleString()} points awarded after completion</p></div> : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:col-span-2">
            {[
              ["Service", booking.service || "Table booking"],
              ["Date", booking.date || "—"],
              ["Time", booking.time || "—"],
              ["Guests", String(booking.guests ?? "—")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            {booking.customer.avatar ? <img src={booking.customer.avatar} alt={booking.customer.name} className="h-20 w-20 rounded-[28px] border-4 border-slate-50 object-cover shadow-sm" /> : <span className="flex h-20 w-20 items-center justify-center rounded-[28px] border-4 border-slate-50 bg-slate-100 text-xl font-black text-slate-500">{booking.customer.name.slice(0, 1).toUpperCase()}</span>}
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {booking.customer.name}
              </h3>
              <p className="text-sm font-medium text-slate-400">{booking.customerSince ? `Customer since ${booking.customerSince}` : "Customer"}</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid gap-3">
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-all hover:border-sky-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Phone
                </span>
                <span className="text-sm font-bold text-slate-700">
                  <span className="block truncate">{booking.phone || "Not provided"}</span>
                </span>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-all hover:border-sky-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Email
                </span>
                <span className="text-sm font-bold text-slate-700">
                  <span className="block truncate">{booking.email || "Not provided"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FileText className="h-4 w-4 text-sky-500" />
              <span className="text-sm font-bold text-slate-800">
                Special Requests
              </span>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-sm font-medium leading-relaxed text-amber-900/80">
                {booking.specialRequests || "No special requests provided."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            {canConfirm ? <button type="button" onClick={() => onUpdateStatus("confirmed")} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.99]"><CheckCircle2 className="h-5 w-5" />Confirm Booking</button> : null}
            {canComplete ? <button type="button" onClick={() => onUpdateStatus("complete")} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-500 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600 active:scale-[0.99]"><CheckCircle2 className="h-5 w-5" />Mark Completed</button> : null}
            {canReschedule ? <button type="button" onClick={() => setRescheduling((value) => !value)} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.99]">
              <Calendar className="h-5 w-5 text-slate-400" />
              Reschedule
            </button> : null}
            {canReschedule && rescheduling ? <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4"><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-500">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-bold text-slate-500">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label></div><button type="button" disabled={!date || !time} onClick={() => { onReschedule(date, time); setRescheduling(false); }} className="w-full rounded-xl bg-[#1e2a5e] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Confirm new time</button></div> : null}

            <div className="flex items-center justify-between px-1 pt-2">
              {canCancel ? <button type="button" onClick={() => onUpdateStatus("cancelled")} className="text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">
                Cancel Booking
              </button> : <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">No further actions</span>}
              <button type="button" onClick={onGenerateReceipt} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-500 transition-colors">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
