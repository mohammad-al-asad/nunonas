"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BookingsHeader } from "@/components/BookingsHeader";
import { HotelBookingsTable } from "@/components/HotelBookingsTable";
import { HotelBooking, HotelBookingDetailsModal } from "@/components/HotelBookingDetailsModal";
import { Pagination } from "@/components/Pagination";
import { vendorListBookings, vendorUpdateBookingStatus } from "@/lib/vendor-api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const ITEMS_PER_PAGE = 10;
const bookingQueryRoot = ["bookings", "hotel"] as const;

function mapStatus(raw: string): HotelBooking["status"] {
  const status = (raw ?? "").toLowerCase().trim();
  if (status === "confirmed") return "CONFIRMED";
  if (status === "pending") return "PENDING";
  if (status === "cancelled" || status === "canceled") return "CANCELLED";
  if (status === "check_in" || status === "check in") return "CHECK IN";
  if (status === "complete" || status === "completed") return "COMPLETE";
  return "PENDING";
}

function toHotelBooking(raw: Record<string, unknown>): HotelBooking {
  const guests = raw.guests ?? raw.guest_count ?? raw.num_guests ?? 1;
  const ratePerNight = Number(raw.rate_per_night ?? raw.base_price ?? raw.price_per_night ?? 0);
  const totalAmount = Number(raw.total_amount ?? 0);
  const serviceFee = Number(raw.service_fee ?? 0);
  const tourismTax = Number(raw.tourism_tax ?? raw.tax ?? 0);
  const nights = Number(raw.nights ?? raw.num_nights ?? 1);
  return {
    id: String(raw.booking_code ?? raw.id ?? "#—"), backendId: String(raw.id ?? ""),
    customer: { name: String(raw.customer_name ?? "Guest"), avatar: String(raw.customer_avatar ?? ""), since: raw.customer_since ? String(raw.customer_since) : new Date().getFullYear().toString() },
    checkIn: String(raw.check_in_date ?? raw.scheduled_date ?? "—"), checkOut: String(raw.check_out_date ?? "—"), nights: nights || 1,
    roomType: String(raw.room_type ?? raw.service ?? raw.listing_type ?? "Room"), roomNumber: String(raw.room_number ?? raw.room_name ?? "—"),
    ratePerNight: ratePerNight || (totalAmount - serviceFee - tourismTax) / (nights || 1), serviceFee, tourismTax,
    status: mapStatus(String(raw.status ?? "")), payment: raw.payment_status === "paid" || raw.payment === "Paid" ? "Paid" : "Unpaid",
    phone: String(raw.customer_phone ?? "—"), email: String(raw.customer_email ?? "—"), specialRequests: String(raw.special_requests ?? raw.special_notes ?? raw.notes ?? ""), guests: `${guests} Guest${Number(guests) !== 1 ? "s" : ""}`,
    requestedAt: String(raw.requested_at ?? raw.created_at ?? ""), acceptedAt: String(raw.accepted_at ?? ""),
    completedAt: String(raw.completed_at ?? ""), canceledAt: String(raw.canceled_at ?? ""), statusNote: String(raw.status_note ?? ""),
    statusHistory: Array.isArray(raw.status_history) ? raw.status_history as HotelBooking["statusHistory"] : [],
    pointsAwarded: Number(raw.points_awarded ?? 0),
  };
}

function pageFrom(value: string | null) { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1; }
function dateFrom(value: string | null) { if (!value) return null; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? null : date; }

export default function HotelBookingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(() => pageFrom(searchParams.get("page")));
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "All");
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);
  const [actionError, setActionError] = useState("");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(() => ({ start: dateFrom(searchParams.get("from")), end: dateFrom(searchParams.get("to")) }));
  const debouncedSearch = useDebouncedValue(searchQuery.trim());
  const from = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : "";
  const to = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : "";

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", String(currentPage));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [currentPage, debouncedSearch, from, pathname, router, statusFilter, to]);

  const bookingsQuery = useQuery({
    queryKey: [...bookingQueryRoot, currentPage, debouncedSearch, statusFilter, from, to],
    queryFn: async () => {
      const raw = await vendorListBookings({ limit: ITEMS_PER_PAGE, skip: (currentPage - 1) * ITEMS_PER_PAGE, search: debouncedSearch || undefined, status: statusFilter !== "All" ? statusFilter : undefined, provider_type: "hotel,hotel_room", date_from: from || undefined, date_to: to || undefined }) as { items?: Record<string, unknown>[]; total?: number };
      const items = raw.items ?? [];
      return { bookings: items.map(toHotelBooking), total: raw.total ?? items.length };
    },
    placeholderData: keepPreviousData,
  });
  const bookings = bookingsQuery.data?.bookings ?? [];
  const total = bookingsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const handleUpdateStatus = async (booking: HotelBooking, status: string) => {
    if (!booking.backendId) return;
    setActionError("");
    try { await vendorUpdateBookingStatus(booking.backendId, status); await queryClient.invalidateQueries({ queryKey: bookingQueryRoot }); setSelectedBooking(null); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Failed to update booking."); }
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8"><div className="w-full">
      <BookingsHeader title="Hotel bookings" description="Manage arrivals, stays, rooms, and booking status." searchQuery={searchQuery} onSearchChange={(value) => { setSearchQuery(value); setCurrentPage(1); }} statusFilter={statusFilter} onStatusChange={(value) => { setStatusFilter(value); setCurrentPage(1); }} dateRange={dateRange} onDateRangeChange={(value) => { setDateRange(value); setCurrentPage(1); }} />
      {bookingsQuery.isFetching && !bookingsQuery.isPending ? <div className="mb-3 text-right text-xs font-bold text-sky-600">Updating results…</div> : null}
      {actionError ? <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{actionError}</div> : null}
      {bookingsQuery.isPending ? <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div> : bookingsQuery.isError ? <div className="rounded-2xl border border-red-100 bg-white p-10 text-center"><p className="text-sm text-red-600">Hotel bookings could not be loaded.</p><button type="button" onClick={() => bookingsQuery.refetch()} className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">Try again</button></div> : bookings.length === 0 ? <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">No bookings found.</div> : <HotelBookingsTable bookings={bookings} onViewDetails={setSelectedBooking} onUpdateStatus={handleUpdateStatus} />}
      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} onPageChange={(page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); }} />
    </div><HotelBookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onUpdateStatus={(status) => { if (selectedBooking) void handleUpdateStatus(selectedBooking, status); }} /></div>
  );
}
