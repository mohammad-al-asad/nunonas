import { queryOptions } from "@tanstack/react-query";
import {
  vendorGetProfileSettings,
  vendorListNotifications,
  vendorGetAnalyticsOverview,
  vendorGetUser,
  vendorGetPromotion,
} from "@/lib/vendor-api";
import {
  vendorGetBookingTrends,
  vendorGetCalendarPreview,
  vendorGetDashboardOverview,
  vendorGetRecentReviews,
  vendorGetUpcomingBookings,
} from "@/lib/vendor-dashboard-api";

export const vendorQueryKeys = {
  all: ["vendor"] as const,
  profile: ["vendor", "profile"] as const,
  events: (filters: Record<string, unknown> = {}) => ["vendor", "events", filters] as const,
  dashboard: ["vendor", "dashboard"] as const,
  dashboardOverview: ["vendor", "dashboard", "overview"] as const,
  bookingTrends: ["vendor", "dashboard", "booking-trends"] as const,
  calendar: (month: string) => ["vendor", "dashboard", "calendar", month] as const,
  upcomingBookings: (limit: number) => ["vendor", "dashboard", "upcoming-bookings", limit] as const,
  recentReviews: (limit: number) => ["vendor", "dashboard", "recent-reviews", limit] as const,
  notifications: (limit: number, skip: number) => ["vendor", "notifications", limit, skip] as const,
  customer: (id: string) => ["vendor", "customer", id] as const,
  promotion: (id: string) => ["vendor", "promotion", id] as const,
  analytics: (dateFrom?: string, dateTo?: string) => ["vendor", "analytics", "overview", dateFrom ?? null, dateTo ?? null] as const,
  bookings: (filters: Record<string, unknown> = {}) => ["vendor", "bookings", filters] as const,
  reviews: (filters: Record<string, unknown> = {}) => ["vendor", "reviews", filters] as const,
  promotions: (filters: Record<string, unknown> = {}) => ["vendor", "promotions", filters] as const,
  rooms: ["vendor", "rooms"] as const,
  services: ["vendor", "services"] as const,
  loyalty: ["vendor", "loyalty"] as const,
  support: ["vendor", "support"] as const,
};

export const vendorProfileQuery = () =>
  queryOptions({
    queryKey: vendorQueryKeys.profile,
    queryFn: ({ signal }) => vendorGetProfileSettings(signal),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });

export const dashboardOverviewQuery = () =>
  queryOptions({
    queryKey: vendorQueryKeys.dashboardOverview,
    queryFn: ({ signal }) => vendorGetDashboardOverview(signal),
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });

export const bookingTrendsQuery = () =>
  queryOptions({
    queryKey: vendorQueryKeys.bookingTrends,
    queryFn: ({ signal }) => vendorGetBookingTrends(signal),
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });

export const calendarPreviewQuery = (month: string) =>
  queryOptions({
    queryKey: vendorQueryKeys.calendar(month),
    queryFn: ({ signal }) => vendorGetCalendarPreview(month, signal),
  });

export const upcomingBookingsQuery = (limit = 10) =>
  queryOptions({
    queryKey: vendorQueryKeys.upcomingBookings(limit),
    queryFn: ({ signal }) => vendorGetUpcomingBookings(limit, signal),
    refetchInterval: 60_000,
  });

export const recentReviewsQuery = (limit = 5) =>
  queryOptions({
    queryKey: vendorQueryKeys.recentReviews(limit),
    queryFn: ({ signal }) => vendorGetRecentReviews(limit, signal),
  });

export const notificationsQuery = (limit = 20, skip = 0) =>
  queryOptions({
    queryKey: vendorQueryKeys.notifications(limit, skip),
    queryFn: ({ signal }) => vendorListNotifications({ limit, skip }, signal),
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: "always",
  });

export const analyticsOverviewQuery = (dateFrom?: string, dateTo?: string) =>
  queryOptions({
    queryKey: vendorQueryKeys.analytics(dateFrom, dateTo),
    queryFn: ({ signal }) => vendorGetAnalyticsOverview({ date_from: dateFrom, date_to: dateTo }, signal),
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

export const customerQuery = (id: string) =>
  queryOptions({ queryKey: vendorQueryKeys.customer(id), queryFn: ({ signal }) => vendorGetUser(id, signal), enabled: Boolean(id), staleTime: 5 * 60_000 });

export const promotionQuery = (id: string) =>
  queryOptions({ queryKey: vendorQueryKeys.promotion(id), queryFn: ({ signal }) => vendorGetPromotion(id, signal), enabled: Boolean(id), staleTime: 60_000 });
