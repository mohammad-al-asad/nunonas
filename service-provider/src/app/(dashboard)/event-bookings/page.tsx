"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Eye, RefreshCw, Search, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import {
  vendorGetBooking,
  vendorListBookings,
  vendorListEvents,
  vendorUpdateBookingStatus,
} from "@/lib/vendor-api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { vendorQueryKeys } from "@/lib/vendor-queries";
import { cn } from "@/lib/utils";

type EventOption = { id: string; title: string; event_date?: string; end_date?: string; start_time?: string; end_time?: string; venue?: string; capacity?: number; ticket_price?: number; description?: string; status?: string };
type EventBooking = Record<string, unknown>;

function value(row: EventBooking, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return String(row[key]);
  }
  return "—";
}

function numericValue(row: EventBooking, ...keys: string[]): number {
  const raw = value(row, ...keys);
  const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(row: EventBooking): string {
  return value(row, "status").trim().toLowerCase();
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["complete", "completed"].includes(normalized)) return "bg-sky-50 text-sky-600";
  if (["cancelled", "canceled"].includes(normalized)) return "bg-rose-50 text-rose-600";
  if (normalized === "confirmed") return "bg-emerald-50 text-emerald-600";
  return "bg-amber-50 text-amber-600";
}

function normalizeEvents(response: Record<string, unknown>): EventOption[] {
  const items = Array.isArray(response.items) ? response.items : [];
  return items.map((row) => ({
    id: String(row.id ?? row._id ?? ""),
    title: String(row.title ?? "Untitled event"),
    event_date: row.event_date == null ? undefined : String(row.event_date),
    end_date: row.end_date == null
      ? row.event_date == null ? undefined : String(row.event_date)
      : String(row.end_date),
    start_time: row.start_time == null ? undefined : String(row.start_time),
    end_time: row.end_time == null ? undefined : String(row.end_time),
    venue: row.venue == null ? undefined : String(row.venue),
    capacity: row.capacity == null ? undefined : Number(row.capacity),
    ticket_price: row.ticket_price == null ? undefined : Number(row.ticket_price),
    description: row.description == null ? undefined : String(row.description),
    status: row.status == null ? undefined : String(row.status),
  })).filter((row) => row.id);
}

function eventDateRange(event: EventOption): string {
  if (!event.event_date) return "—";
  if (!event.end_date || event.end_date === event.event_date) {
    return event.event_date;
  }
  return `${event.event_date} - ${event.end_date}`;
}

function bookingItems(response: Record<string, unknown>): EventBooking[] {
  return (Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.bookings)
      ? response.bookings
      : []) as EventBooking[];
}

async function listAllEventBookings(eventId: string, signal?: AbortSignal) {
  const items: EventBooking[] = [];
  let skip = 0;
  let totalItems = 0;
  do {
    const response = await vendorListBookings({
      limit: 200,
      skip,
      provider_type: "event",
      event_id: eventId,
    }, signal);
    const pageItems = bookingItems(response);
    items.push(...pageItems);
    totalItems = Number(response.total ?? items.length);
    skip += pageItems.length;
    if (pageItems.length === 0) break;
  } while (items.length < totalItems);
  return items;
}

export default function EventBookingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<EventBooking | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const eventsQuery = useQuery({
    queryKey: vendorQueryKeys.events(),
    queryFn: ({ signal }) => vendorListEvents({}, signal),
    staleTime: 30_000,
  });
  const bookingsQuery = useQuery({
    queryKey: vendorQueryKeys.bookings({
      view: "events",
      eventId: eventId || null,
      status,
      search: debouncedSearch,
    }),
    queryFn: ({ signal }) => vendorListBookings({
      limit: 100,
      skip: 0,
      provider_type: "event",
      event_id: eventId || undefined,
      status: status === "all" ? undefined : status,
      search: debouncedSearch || undefined,
    }, signal),
  });
  const eventSummaryQuery = useQuery({
    queryKey: vendorQueryKeys.bookings({ view: "event-summary", eventId }),
    queryFn: ({ signal }) => listAllEventBookings(eventId, signal),
    enabled: Boolean(eventId),
    staleTime: 10_000,
  });

  const events = eventsQuery.data ? normalizeEvents(eventsQuery.data) : [];
  const bookings = bookingsQuery.data ? bookingItems(bookingsQuery.data) : [];
  const eventBookings = eventSummaryQuery.data ?? [];
  const total = Number(bookingsQuery.data?.total ?? bookings.length);
  const loading = bookingsQuery.isPending;
  const eventsLoading = eventsQuery.isPending;
  const refreshing = bookingsQuery.isFetching || eventSummaryQuery.isFetching;

  const detailsMutation = useMutation({
    mutationFn: vendorGetBooking,
    onSuccess: (booking) => setSelected(booking),
    onError: (error) => toast(error instanceof Error ? error.message : "Booking details could not be loaded.", "error"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, nextStatus }: { bookingId: string; nextStatus: string }) =>
      vendorUpdateBookingStatus(bookingId, nextStatus),
    onSuccess: async (_, variables) => {
      toast(`Booking ${variables.nextStatus}.`, "success");
      await queryClient.invalidateQueries({ queryKey: ["vendor", "bookings"] });
      setSelected((current) => current && String(current.id ?? current._id) === variables.bookingId
        ? { ...current, status: variables.nextStatus }
        : current);
    },
    onError: (error) => toast(error instanceof Error ? error.message : "Booking status could not be updated.", "error"),
  });

  const viewDetails = async (booking: EventBooking) => {
    const bookingId = String(booking.id ?? booking._id ?? "");
    if (!bookingId) return;
    await detailsMutation.mutateAsync(bookingId).catch(() => undefined);
  };

  const updateStatus = async (booking: EventBooking, nextStatus: string) => {
    const bookingId = String(booking.id ?? booking._id ?? "");
    if (!bookingId) return;
    await statusMutation.mutateAsync({ bookingId, nextStatus }).catch(() => undefined);
  };

  const refreshPage = async () => {
    await Promise.all([
      eventsQuery.refetch(),
      bookingsQuery.refetch(),
      eventId ? eventSummaryQuery.refetch() : Promise.resolve(),
    ]);
  };

  const detailLoading = detailsMutation.isPending;
  const updatingId = statusMutation.isPending ? statusMutation.variables?.bookingId ?? "" : "";
  const selectedEvent = events.find((event) => event.id === eventId);
  const capacity = Math.max(Number(selectedEvent?.capacity ?? 0), 0);
  const ticketPrice = Math.max(Number(selectedEvent?.ticket_price ?? 0), 0);
  const activeBookings = eventBookings
    .filter((booking) => ["pending", "confirmed", "check_in"].includes(normalizeStatus(booking)));
  const bookedSeats = activeBookings
    .reduce((sum, booking) => sum + numericValue(booking, "quantity", "guests", "guest_count"), 0);
  const completedBookings = eventBookings.filter((booking) => ["complete", "completed"].includes(normalizeStatus(booking)));
  const completedTickets = completedBookings.reduce(
    (sum, booking) => sum + numericValue(booking, "quantity", "guests", "guest_count"),
    0,
  );
  const completedRevenue = completedBookings.reduce((sum, booking) => {
    const storedTotal = numericValue(booking, "total_amount", "total", "amount");
    const quantity = numericValue(booking, "quantity", "guests", "guest_count");
    return sum + (storedTotal || quantity * ticketPrice);
  }, 0);
  const availableSeats = Math.max(capacity - bookedSeats, 0);

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <Header title="Event Bookings" />
      <main className="w-full space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <div className="flex items-center gap-3">
            <label htmlFor="event-filter" className="sr-only">Select event</label>
            <div className="relative min-w-[240px]">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select id="event-filter" value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={eventsLoading} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400">
                <option value="">All events</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.title}{event.event_date ? ` — ${eventDateRange(event)}` : ""}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => { void refreshPage(); }} disabled={refreshing} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />Refresh</button>
          </div>
        </div>

        {eventsQuery.isError || bookingsQuery.isError || eventSummaryQuery.isError ? <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 sm:flex-row sm:items-center sm:justify-between"><span>Some event booking data could not be loaded.</span><button type="button" onClick={() => { void refreshPage(); }} className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-600 shadow-sm">Try again</button></div> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking code or customer" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-sky-400" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-sky-400"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>

        {selectedEvent ? <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-5 lg:flex-row"><div><p className="text-xs font-black uppercase tracking-widest text-sky-600">Selected event</p><h2 className="mt-2 text-2xl font-black text-slate-800">{selectedEvent.title}</h2><p className="mt-2 max-w-3xl text-sm text-slate-500">{selectedEvent.description || "No event description provided."}</p></div><span className={cn("h-fit rounded-lg px-3 py-1 text-xs font-black uppercase", selectedEvent.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600")}>{selectedEvent.status || "draft"}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date range</p><p className="mt-1 text-sm font-bold text-slate-700">{eventDateRange(selectedEvent)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</p><p className="mt-1 text-sm font-bold text-slate-700">{selectedEvent.start_time || "—"} - {selectedEvent.end_time || "—"}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Venue</p><p className="mt-1 text-sm font-bold text-slate-700">{selectedEvent.venue || "—"}</p></div></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total capacity</p><p className="mt-1 text-xl font-black text-slate-800">{capacity}</p><p className="mt-1 text-xs text-slate-400">seats</p></div><div className="rounded-xl bg-sky-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Booked seats</p><p className="mt-1 text-xl font-black text-sky-700">{bookedSeats}</p><p className="mt-1 text-xs text-sky-500">{activeBookings.length} active booking{activeBookings.length === 1 ? "" : "s"}</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Available seats</p><p className="mt-1 text-xl font-black text-emerald-700">{availableSeats}</p><p className="mt-1 text-xs text-emerald-500">{capacity} capacity - {bookedSeats} booked</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Ticket price</p><p className="mt-1 text-xl font-black text-amber-700">${ticketPrice.toFixed(2)}</p><p className="mt-1 text-xs text-amber-500">per ticket</p></div><div className="rounded-xl bg-violet-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Completed revenue</p><p className="mt-1 text-xl font-black text-violet-700">${completedRevenue.toFixed(2)}</p><p className="mt-1 text-xs text-violet-500">{completedTickets} completed ticket{completedTickets === 1 ? "" : "s"} only</p></div></div><p className="mt-3 text-xs font-semibold text-slate-400">Revenue is the sum of each completed booking total. If a booking has no saved total, it is calculated as tickets × ticket price. Cancelled, pending, and confirmed bookings are excluded from revenue.</p></section> : null}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-black text-slate-800">{eventId ? events.find((event) => event.id === eventId)?.title || "Selected event" : "All event bookings"}</h2><span className="text-sm font-bold text-slate-400">{total} booking{total === 1 ? "" : "s"}</span></div>
          {loading ? <div className="h-64 animate-pulse bg-slate-50" /> : bookings.length === 0 ? <div className="p-16 text-center text-sm font-semibold text-slate-400">No event bookings found for this selection.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="border-b border-slate-100 bg-slate-50/70"><tr>{["Booking", "Customer", "Date / time", "Tickets", "Status", "Payment", "Actions"].map((label) => <th key={label} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{bookings.map((booking, index) => { const bookingId = String(value(booking, "id", "_id")); const currentStatus = String(value(booking, "status")); return <tr key={bookingId || index} className="hover:bg-sky-50/30"><td className="px-6 py-4 text-sm font-black text-sky-600">{value(booking, "booking_code", "id")}</td><td className="px-6 py-4 text-sm font-bold text-slate-800">{value(booking, "customer_name", "customer")}</td><td className="px-6 py-4"><p className="text-sm font-bold text-slate-700">{value(booking, "scheduled_date", "date")}</p><p className="text-xs text-slate-400">{value(booking, "scheduled_time", "time")}</p></td><td className="px-6 py-4 text-sm font-bold text-slate-700">{value(booking, "quantity", "guests", "guest_count")}</td><td className="px-6 py-4"><span className={cn("rounded-lg px-3 py-1 text-xs font-black uppercase", statusClass(currentStatus))}>{currentStatus}</span></td><td className="px-6 py-4 text-sm font-bold capitalize text-slate-400">{value(booking, "payment_status", "payment")}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><button type="button" onClick={() => void viewDetails(booking)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Eye className="h-4 w-4" /></button>{["pending", "confirmed"].includes(currentStatus.toLowerCase()) ? <button type="button" disabled={updatingId === bookingId} onClick={() => void updateStatus(booking, currentStatus.toLowerCase() === "pending" ? "confirmed" : "complete")} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-black uppercase text-white disabled:opacity-50">{currentStatus.toLowerCase() === "pending" ? "Approve" : "Complete"}</button> : null}</div></td></tr>; })}</tbody></table></div>}
        </section>
      </main>

      {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setSelected(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-sky-600">Booking details</p><h2 className="mt-2 text-2xl font-black text-slate-800">{String(value(selected, "booking_code", "id"))}</h2></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Customer", value(selected, "customer_name", "customer")], ["Email", value(selected, "customer_email", "email")], ["Phone", value(selected, "customer_phone", "phone")], ["Event", value(selected, "service", "event_title")], ["Date", value(selected, "scheduled_date", "date")], ["Time", value(selected, "scheduled_time", "time")], ["Tickets", value(selected, "quantity", "guests", "guest_count")], ["Payment", value(selected, "payment_status", "payment")], ["Status", value(selected, "status")]].map(([label, item]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-sm font-bold capitalize text-slate-700">{String(item)}</p></div>)}</div><div className="mt-6 flex flex-wrap gap-3">{["pending", "confirmed"].includes(String(value(selected, "status")).toLowerCase()) ? <button type="button" disabled={detailLoading} onClick={() => void updateStatus(selected, String(value(selected, "status")).toLowerCase() === "pending" ? "confirmed" : "complete")} className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{String(value(selected, "status")).toLowerCase() === "pending" ? "Approve booking" : "Mark completed"}</button> : null}<button type="button" disabled={detailLoading} onClick={() => void updateStatus(selected, "canceled")} className="rounded-xl bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 disabled:opacity-50">Cancel booking</button></div></div></div> : null}
    </div>
  );
}
