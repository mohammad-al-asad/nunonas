"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BookingDetailsModal } from "@/components/BookingDetailsModal";
import { BookingsHeader } from "@/components/BookingsHeader";
import { BookingsTable, type Booking } from "@/components/BookingsTable";
import { Pagination } from "@/components/Pagination";
import {
  vendorGenerateReceipt,
  vendorListBookings,
  vendorRescheduleBooking,
  vendorUpdateBookingStatus,
} from "@/lib/vendor-api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const ITEMS_PER_PAGE = 10;
const bookingQueryRoot = ["bookings", "spa"] as const;

function normalizeStatus(raw: unknown): Booking["status"] {
  const value = String(raw ?? "").toLowerCase().trim();
  if (value === "confirmed") return "Confirmed";
  if (value === "pending") return "Pending";
  if (value === "cancelled" || value === "canceled") return "Cancelled";
  if (value === "complete" || value === "completed") return "Complete";
  return "Pending";
}

function toSpaBooking(raw: Record<string, unknown>): Booking {
  const customerName = String(raw.customer_name ?? raw.customer ?? "Guest");
  return {
    id: String(raw.booking_code ?? raw.id ?? "Booking"),
    backendId: String(raw.id ?? ""),
    customer: {
      name: customerName,
      avatar: String(raw.customer_avatar ?? raw.avatar_url ?? "").trim(),
    },
    phone: String(raw.customer_phone ?? ""),
    email: String(raw.customer_email ?? ""),
    specialRequests: String(
      raw.special_requests ?? raw.special_notes ?? raw.notes ?? "",
    ),
    customerSince: String(raw.customer_since ?? ""),
    requestedAt: String(raw.requested_at ?? raw.created_at ?? ""),
    acceptedAt: String(raw.accepted_at ?? ""),
    completedAt: String(raw.completed_at ?? ""),
    canceledAt: String(raw.canceled_at ?? ""),
    statusNote: String(raw.status_note ?? ""),
    statusHistory: Array.isArray(raw.status_history) ? raw.status_history as Booking["statusHistory"] : [],
    pointsAwarded: Number(raw.points_awarded ?? 0),
    date: String(raw.date ?? raw.scheduled_date ?? "—"),
    time: String(raw.time ?? raw.scheduled_time ?? "—"),
    guests: Number(raw.guests ?? raw.guest_count ?? raw.num_guests ?? 1),
    service: String(
      raw.service_name ??
        raw.treatment_name ??
        raw.service ??
        raw.listing_name ??
        "Spa treatment",
    ),
    status: normalizeStatus(raw.status),
    payment:
      String(raw.payment_status ?? raw.payment ?? "Unpaid").toLowerCase() ===
      "paid"
        ? "Paid"
        : "Unpaid",
  };
}

function validPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function validDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function SpaBookingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(() =>
    validPage(searchParams.get("page")),
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "All",
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>(() => ({
    start: validDate(searchParams.get("from")),
    end: validDate(searchParams.get("to")),
  }));
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
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [
    currentPage,
    debouncedSearch,
    from,
    pathname,
    router,
    statusFilter,
    to,
  ]);

  const bookingsQuery = useQuery({
    queryKey: [
      ...bookingQueryRoot,
      currentPage,
      debouncedSearch,
      statusFilter,
      from,
      to,
    ],
    queryFn: async () => {
      const raw = (await vendorListBookings({
        limit: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        provider_type: "spa",
        date_from: from || undefined,
        date_to: to || undefined,
      })) as {
        items?: Record<string, unknown>[];
        bookings?: Record<string, unknown>[];
        total?: number;
      };
      const items = raw.items ?? raw.bookings ?? [];
      return {
        bookings: items.map(toSpaBooking),
        total: raw.total ?? items.length,
      };
    },
    placeholderData: keepPreviousData,
  });
  const bookings = bookingsQuery.data?.bookings ?? [];
  const total = bookingsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const refreshBookings = () =>
    queryClient.invalidateQueries({ queryKey: bookingQueryRoot });

  const handleUpdateStatus = async (booking: Booking, status: string) => {
    if (!booking.backendId) return;
    setActionError("");
    try {
      await vendorUpdateBookingStatus(booking.backendId, status);
      await refreshBookings();
      setSelectedBooking(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to update booking.",
      );
    }
  };

  const handleReschedule = async (
    booking: Booking,
    date: string,
    time: string,
  ) => {
    if (!booking.backendId) return;
    setActionError("");
    try {
      await vendorRescheduleBooking(booking.backendId, { date, time });
      await refreshBookings();
      setSelectedBooking(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to reschedule booking.",
      );
    }
  };

  const handleReceipt = async (booking: Booking) => {
    if (!booking.backendId) return;
    setActionError("");
    try {
      const result = await vendorGenerateReceipt(booking.backendId);
      const url = String(result.download_url ?? result.receipt_url ?? "");
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else if (typeof result.content === "string") {
        const blob = new Blob([result.content], {
          type: String(result.content_type ?? "text/html;charset=utf-8"),
        });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = String(
          result.filename ?? `receipt-${booking.id}.html`,
        );
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        setActionError(
          "The receipt response was incomplete. Please try again.",
        );
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to generate receipt.",
      );
    }
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full">
        <BookingsHeader
          title="Spa booking management"
          description="Manage spa appointments, guest requests, payments, and booking status."
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          dateRange={dateRange}
          onDateRangeChange={(value) => {
            setDateRange(value);
            setCurrentPage(1);
          }}
        />
        {bookingsQuery.isFetching && !bookingsQuery.isPending ? (
          <div className="mb-3 text-right text-xs font-bold text-sky-600">
            Updating results…
          </div>
        ) : null}
        {actionError ? (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700"
          >
            {actionError}
          </div>
        ) : null}
        {bookingsQuery.isPending ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : bookingsQuery.isError ? (
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center">
            <p className="text-sm text-red-600">
              Spa bookings could not be loaded.
            </p>
            <button
              type="button"
              onClick={() => bookingsQuery.refetch()}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold"
            >
              Try again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">
            No spa bookings found.
          </div>
        ) : (
          <BookingsTable
            bookings={bookings}
            onViewDetails={setSelectedBooking}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => {
            if (page >= 1 && page <= totalPages) setCurrentPage(page);
          }}
        />
      </div>
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdateStatus={(status) => {
          if (selectedBooking)
            void handleUpdateStatus(selectedBooking, status);
        }}
        onReschedule={(date, time) => {
          if (selectedBooking)
            void handleReschedule(selectedBooking, date, time);
        }}
        onGenerateReceipt={() => {
          if (selectedBooking) void handleReceipt(selectedBooking);
        }}
      />
    </div>
  );
}
