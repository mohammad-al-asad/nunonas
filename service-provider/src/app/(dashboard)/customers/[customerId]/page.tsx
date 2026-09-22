"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { customerQuery } from "@/lib/vendor-queries";
import { ErrorState, LoadingSkeleton } from "@/components/ui/AsyncState";

function text(value: unknown, fallback = "Not provided") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function formatDate(value: unknown) {
  const result = String(value ?? "").trim();
  if (!result) return "Not provided";
  const parsed = new Date(result);
  return Number.isNaN(parsed.getTime()) ? result : parsed.toLocaleString();
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-slate-700">{text(value)}</p>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const id = decodeURIComponent(String(customerId ?? ""));
  const { data: customer, isLoading, isError, error, refetch } = useQuery(customerQuery(id));
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header title="Customer Details" />
      <main className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>

        {isLoading ? <LoadingSkeleton className="h-40 w-full" /> : null}
        {isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Failed to load customer."
            }
            onRetry={() => void refetch()}
          />
        ) : null}

        {customer ? (
          <section className="w-full rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-slate-800">
                  {String(customer.full_name ?? "Customer")}
                </h1>
                <p className="text-sm text-slate-400">Customer account</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Email
                </p>
                <p className="mt-2 break-words text-sm font-bold text-slate-700">
                  {String(customer.email ?? "Not provided")}
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Phone
                </p>
                <p className="mt-2 break-words text-sm font-bold text-slate-700">
                  {String(customer.phone ?? "Not provided")}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Booking history</h2>
                <p className="mt-1 text-sm text-slate-400">Complete service and reservation details for this customer.</p>
              </div>
              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Total bookings</p>
                <p className="mt-1 text-xl font-black text-sky-700">{text(customer.total_bookings, "0")}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {Array.isArray(customer.bookings) && customer.bookings.length > 0 ? customer.bookings.map((booking: Record<string, unknown>, index: number) => (
                <article key={String(booking.id ?? index)} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    {booking.image || booking.image_url || booking.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(booking.image ?? booking.image_url ?? booking.cover_image_url)} alt="" className="h-28 w-full rounded-xl object-cover lg:h-24 lg:w-36" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black text-slate-800">{text(booking.service ?? booking.room_type, "Booking")}</h3>
                          <p className="mt-1 text-xs text-slate-500">{text(booking.provider_type, "Service")} · {text(booking.booking_code ?? booking.id)}</p>
                        </div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase text-sky-600">{text(booking.status, "Pending")}</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <Detail label="When" value={`${text(booking.scheduled_date ?? booking.date)}${booking.scheduled_time ?? booking.time ? ` at ${text(booking.scheduled_time ?? booking.time)}` : ""}`} />
                        <Detail label="Guests" value={booking.guests ?? booking.quantity ?? booking.guest_count} />
                        <Detail label="Payment" value={text(booking.payment_status, "Unknown").toUpperCase()} />
                        <Detail label="Amount" value={booking.total_amount ?? booking.amount} />
                        <Detail label="Assigned staff" value={booking.staff_name ?? booking.assigned_staff ?? booking.staff} />
                        <Detail label="Seating" value={booking.seating_preference} />
                        {booking.check_in_date || booking.check_out_date ? <Detail label="Stay" value={`${text(booking.check_in_date)} to ${text(booking.check_out_date)}`} /> : null}
                        <Detail label="Booked at" value={formatDate(booking.created_at)} />
                      </div>
                      <div className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-600"><span className="font-black text-slate-700">Notes:</span> {text(booking.special_requests ?? booking.special_notes ?? booking.notes, "None")}</div>
                    </div>
                  </div>
                </article>
              )) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No bookings found for this customer.</div>}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
