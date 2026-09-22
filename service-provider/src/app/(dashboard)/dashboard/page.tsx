"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { BadgePercent, CalendarPlus2, Hotel, Megaphone, UtensilsCrossed, Waves } from "lucide-react";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import type { TrendPoint } from "@/components/BookingTrendsChart";
import { AllBookingsTable, type DashboardBooking } from "@/components/AllBookingsTable";
import type { UpcomingBooking } from "@/components/UpcomingBookingsTable";
import { CalendarPreview, type CalendarPreviewPayload } from "@/components/CalendarPreview";
import { RecentReviews, type RecentReview } from "@/components/RecentReviews";
import { dashboardOverviewQuery, vendorProfileQuery } from "@/lib/vendor-queries";
import { extractVendorCategories } from "@/lib/vendor-access";

const BookingTrendsChart = dynamic(
  () => import("@/components/BookingTrendsChart").then((module) => module.BookingTrendsChart),
  { ssr: false, loading: () => <div className="h-[380px] animate-pulse rounded-2xl bg-white" /> },
);

type DashboardOverview = {
  kpis?: { total_bookings_month?: number; todays_bookings?: number; monthly_revenue?: number; occupancy_rate?: number; average_rating?: number };
  booking_breakdown?: { by_service?: Record<string, number> };
  booking_rows?: DashboardBooking[];
  booking_trends?: TrendPoint[];
  calendar_preview?: CalendarPreviewPayload;
  upcoming_bookings?: UpcomingBooking[];
  recent_reviews?: RecentReview[];
};

function currencyCode(profile: Record<string, unknown> | undefined) {
  const value = String(profile?.currency_code ?? profile?.currency ?? "USD").toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : "USD";
}

function formatCurrency(value: unknown, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

export default function Dashboard() {
  // Keep the first render identical on the server and browser. Vendor
  // categories arrive from the client query and would otherwise change the
  // quick-action links during hydration.
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const overviewQuery = useQuery(dashboardOverviewQuery());
  const profileQuery = useQuery(vendorProfileQuery());
  const overview = overviewQuery.data as DashboardOverview | undefined;
  const profile = profileQuery.data as Record<string, unknown> | undefined;
  const categories = hydrated
    ? extractVendorCategories(profile?.categories ?? profile?.category)
    : [];
  const currency = currencyCode(profile);
  const kpis = overview?.kpis;
  const bookingsHref = categories.includes("Restaurant")
    ? "/restaurant-bookings"
    : categories.includes("Hotel")
      ? "/hotel-bookings"
      : categories.includes("Spa")
        ? "/spa-bookings"
        : categories.includes("Event")
          ? "/event-bookings"
          : "/happy-hours";
  const bookingsLinkLabel =
    categories.includes("Happy Hour") &&
    !categories.some((category) =>
      ["Restaurant", "Hotel", "Spa", "Event"].includes(category),
    )
      ? "Manage Happy Hours"
      : "View today’s bookings";
  const quickActions = [
    categories.includes("Restaurant") ? { label: "Manage menu", href: "/services", icon: UtensilsCrossed } : null,
    categories.includes("Hotel") ? { label: "Add hotel service", href: "/hotel-services/add-service", icon: Hotel } : null,
    categories.includes("Hotel") ? { label: "Update availability", href: "/hotel-services", icon: Hotel } : null,
    categories.includes("Spa") ? { label: "Manage spa services", href: "/spa-services", icon: Waves } : null,
    { label: "Create promotion", href: "/promotions/new", icon: Megaphone },
    categories.includes("Event") ? { label: "Create event", href: "/events/new", icon: CalendarPlus2 } : null,
    categories.includes("Happy Hour") ? { label: "Manage Happy Hours", href: "/happy-hours", icon: BadgePercent } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: typeof Hotel }>;
  const pendingBookings = (overview?.upcoming_bookings ?? []).filter((booking) => String(booking.status ?? "").toLowerCase() === "pending").length;
  const unpaidBookings = (overview?.upcoming_bookings ?? []).filter((booking) => ["unpaid", "failed"].includes(String(booking.payment_status ?? booking.payment ?? "").toLowerCase())).length;
  const unansweredReviews = (overview?.recent_reviews ?? []).filter(
    (review) => !(review.vendor_reply ?? review.reply),
  ).length;
  const attentionItems = [
    { label: "Pending confirmations", count: pendingBookings, href: bookingsHref },
    { label: "Payments needing attention", count: unpaidBookings, href: bookingsHref },
    { label: "Reviews awaiting reply", count: unansweredReviews, href: "/reviews" },
  ].filter((item) => item.count > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <main className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-labelledby="quick-actions-title" className="space-y-3">
          <div className="flex items-center justify-between"><h2 id="quick-actions-title" className="text-sm font-bold uppercase tracking-wider text-slate-400">Quick actions</h2><Link href={bookingsHref} prefetch={false} className="text-sm font-bold text-sky-600">{bookingsLinkLabel}</Link></div>
          <div className="flex gap-3 overflow-x-auto pb-1">{quickActions.map((action) => <Link key={action.href} href={action.href} prefetch={false} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-600"><action.icon className="h-4 w-4" />{action.label}</Link>)}</div>
        </section>

        {attentionItems.length > 0 ? (
          <section aria-labelledby="attention-title" className="space-y-3">
            <h2 id="attention-title" className="text-sm font-bold uppercase tracking-wider text-slate-400">Needs your attention</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{attentionItems.map((item) => <Link key={item.label} href={item.href} prefetch={false} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4 text-sm font-bold text-slate-700"><span>{item.label}</span><span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 px-2 text-xs text-white">{item.count}</span></Link>)}</div>
          </section>
        ) : null}

        {overviewQuery.isPending ? <DashboardSkeleton /> : overviewQuery.isError ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center"><h2 className="font-bold text-slate-800">Dashboard data could not be loaded</h2><p className="mt-2 text-sm text-slate-500">Your existing data is safe. Check the connection and try again.</p><button type="button" onClick={() => overviewQuery.refetch()} className="mt-4 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white">Try again</button></div>
        ) : (
          <>
            <section aria-label="Business metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatsCard title="Bookings this month" value={String(kpis?.total_bookings_month ?? 0)} trend={{ value: "Current month", type: "neutral" }} />
              <StatsCard title="Today's bookings" value={String(kpis?.todays_bookings ?? 0)} trend={{ value: "Scheduled today", type: "alert" }} />
              <StatsCard title="Revenue this month" value={formatCurrency(kpis?.monthly_revenue, currency)} trend={{ value: "Month to date", type: "neutral" }} />
              <StatsCard title="Occupancy rate" value={`${Number(kpis?.occupancy_rate ?? 0)}%`} trend={{ value: "Current utilization", type: "neutral" }} />
              <StatsCard title="Average rating" value={Number(kpis?.average_rating ?? 0).toFixed(1)} trend={{ value: "Out of 5", type: "rating" }} />
            </section>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8"><div className="lg:col-span-2"><BookingTrendsChart trends={overview?.booking_trends} /></div><CalendarPreview initialData={overview?.calendar_preview} /></div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8"><div className="lg:col-span-2"><AllBookingsTable bookings={overview?.booking_rows} /></div><RecentReviews reviews={overview?.recent_reviews} /></div>
          </>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return <div aria-label="Loading dashboard" className="animate-pulse space-y-8"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 rounded-2xl bg-white" />)}</div><div className="grid gap-6 lg:grid-cols-3"><div className="h-96 rounded-2xl bg-white lg:col-span-2" /><div className="h-96 rounded-2xl bg-white" /></div></div>;
}
