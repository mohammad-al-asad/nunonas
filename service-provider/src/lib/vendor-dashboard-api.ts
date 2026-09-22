import { vendorRequest } from "@/lib/vendor-api";

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function vendorGetDashboardOverview(signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>("/vendor/dashboard/overview", "GET", undefined, { signal });
}

export function vendorGetBookingTrends(signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>("/vendor/dashboard/booking-trends", "GET", undefined, { signal });
}

export function vendorGetCalendarPreview(month?: string, signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/calendar-preview${query({ month })}`, "GET", undefined, { signal });
}

export function vendorGetUpcomingBookings(limit = 10, signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/upcoming-bookings${query({ limit })}`, "GET", undefined, { signal });
}

export function vendorGetRecentReviews(limit = 5, signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/recent-reviews${query({ limit })}`, "GET", undefined, { signal });
}
