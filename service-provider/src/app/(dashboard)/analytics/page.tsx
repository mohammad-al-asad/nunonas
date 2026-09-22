"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";
import {
  Calendar,
  ChevronDown,
  Download,
  Star,
} from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import { vendorExportAnalytics } from "@/lib/vendor-api";
import { analyticsOverviewQuery } from "@/lib/vendor-queries";

type AnalyticsOverview = {
  total_bookings?: number;
  total_bookings_month?: number;
  todays_bookings?: number;
  monthly_revenue?: number;
  occupancy_rate?: number;
  average_rating?: number;
  demographics?: {
    gender_distribution?: { female?: number; male?: number };
    age_groups?: Record<string, number>;
  };
  occupancy_tracking?: {
    occupancy_rate?: number;
    rooms_available?: number;
    rooms_total?: number;
    active_bookings?: number;
  };
  reviews_summary?: {
    average_rating?: number;
    total_reviews?: number;
    breakdown?: Record<string, number>;
  };
  booking_breakdown?: {
    completed?: number;
    cancelled?: number;
    pending?: number;
    confirmed?: number;
    by_service?: Record<string, number>;
  };
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const today = new Date();
    return {
      start: from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(`${from}T00:00:00`) : subDays(today, 29),
      end: to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(`${to}T00:00:00`) : today,
    };
  });
  const dateFrom = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : undefined;
  const dateTo = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : undefined;
  const overviewQuery = useQuery(analyticsOverviewQuery(dateFrom, dateTo));
  const handleRangeChange = (range: { start: Date | null; end: Date | null }) => {
    setDateRange(range);
    if (!range.start || !range.end) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", format(range.start, "yyyy-MM-dd"));
    params.set("to", format(range.end, "yyyy-MM-dd"));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const report = await vendorExportAnalytics({ date_from: dateFrom, date_to: dateTo });
      const fallbackCsv = [
        ["Metric", "Value"],
        ["Date from", dateFrom ?? "Current month"],
        ["Date to", dateTo ?? "Today"],
        ["Total bookings", overview?.total_bookings ?? overview?.total_bookings_month ?? 0],
        ["Revenue", overview?.monthly_revenue ?? 0],
        ["Occupancy rate", overview?.occupancy_rate ?? overview?.occupancy_tracking?.occupancy_rate ?? 0],
        ["Average rating", overview?.average_rating ?? overview?.reviews_summary?.average_rating ?? 0],
      ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
      const blob = new Blob([report.content || fallbackCsv], { type: report.content_type || "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = report.filename || "vendor-analytics.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      toast("Analytics report downloaded.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  const overview = overviewQuery.data as AnalyticsOverview | undefined;
  const loading = overviewQuery.isPending;
  const demographics = overview?.demographics ?? {};
  const gender = demographics.gender_distribution ?? {};
  const ageGroups = demographics.age_groups ?? {};
  const femalePercent = Number(gender.female ?? 0);
  const malePercent = Number(gender.male ?? 0);
  const otherPercent = Math.max(0, 100 - femalePercent - malePercent);
  const occupancy = overview?.occupancy_tracking ?? {};
  const reviews = overview?.reviews_summary ?? {};
  const bookingBreakdown = overview?.booking_breakdown ?? {};
  const serviceCounts = bookingBreakdown.by_service ?? {};
  const breakdown = reviews.breakdown ?? {};
  const rangeText =
    dateRange.start && dateRange.end
      ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd, yyyy")}`
      : dateRange.start
        ? `${format(dateRange.start, "MMM dd")} - Select End`
        : "Select Date Range";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header
        title="Business Analytics"
        description="Live metrics from the vendor analytics endpoints."
      />

      <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  aria-expanded={isCalendarOpen}
                  aria-haspopup="dialog"
                  onClick={() => setIsCalendarOpen((value) => !value)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">{rangeText}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {isCalendarOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2">
                    <DatePicker onClose={() => setIsCalendarOpen(false)} selectedRange={dateRange} onRangeChange={handleRangeChange} />
                  </div>
                )}
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-[#1a2552] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export Report"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse rounded-[32px] border border-slate-100 bg-white p-10 text-sm text-slate-400">Loading analytics...</div>
          ) : overviewQuery.isError ? (
            <div className="rounded-[32px] border border-red-100 bg-white p-10 text-center text-sm text-red-600">Analytics could not be loaded.<button type="button" onClick={() => overviewQuery.refetch()} className="ml-3 rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700">Try again</button></div>
          ) : (
            <>
              <section aria-labelledby="booking-breakdown-title" className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5">
                  <h2 id="booking-breakdown-title" className="text-xl font-bold text-slate-800">Booking breakdown</h2>
                  <p className="mt-1 text-sm text-slate-400">All booking outcomes and service types in the selected range.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Completed", bookingBreakdown.completed ?? 0, "text-emerald-600", "bg-emerald-50"],
                    ["Cancelled", bookingBreakdown.cancelled ?? 0, "text-rose-600", "bg-rose-50"],
                    ["Pending", bookingBreakdown.pending ?? 0, "text-amber-600", "bg-amber-50"],
                    ["Confirmed", bookingBreakdown.confirmed ?? 0, "text-sky-600", "bg-sky-50"],
                  ].map(([label, value, color, background]) => (
                    <div key={String(label)} className={`rounded-2xl p-4 ${background}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                      <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">By service type</p>
                  {Object.keys(serviceCounts).length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                      <div className="grid grid-cols-[1fr_auto] border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Service type</span><span>Bookings</span>
                      </div>
                      {Object.entries(serviceCounts).map(([service, count]) => (
                        <div key={service} className="grid grid-cols-[1fr_auto] items-center border-b border-slate-100 px-4 py-3 last:border-b-0">
                          <span className="text-sm font-bold capitalize text-slate-700">{service}</span>
                          <span className="text-sm font-black text-[#1e2a5e]">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-sm text-slate-400">No service-type booking data available.</p>}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
                  <h3 className="mb-10 text-xl font-bold text-slate-800">Customer Demographics</h3>
                  <div className="flex flex-col gap-12 md:flex-row md:items-center">
                    <div className="relative h-64 w-64 shrink-0">
                      <div
                        className="h-full w-full rounded-full p-8"
                        style={{ background: `conic-gradient(#ec4899 0 ${femalePercent}%, #bae6fd ${femalePercent}% ${femalePercent + malePercent}%, #e2e8f0 ${femalePercent + malePercent}% 100%)` }}
                      >
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                          <span className="text-sm font-black uppercase tracking-widest text-slate-400">Gender</span>
                          <span className="text-[10px] font-medium text-slate-400">Live distribution</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="mb-10 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-pink-500" />
                          <span className="text-xs font-bold text-slate-600">Female ({femalePercent}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-sky-100" />
                          <span className="text-xs font-bold text-slate-400">Male ({malePercent}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-slate-200" />
                          <span className="text-xs font-bold text-slate-400">Other ({otherPercent}%)</span>
                        </div>
                      </div>

                      {Object.entries(ageGroups).map(([label, value]) => (
                        <div key={label} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black tracking-wider">
                            <span className="text-slate-400">{label === "under_18" ? "UNDER 18" : `${label.toUpperCase()} YEARS`}</span>
                            <span className="text-slate-600">{value as number}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-50">
                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${value as number}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Occupancy Tracking</h3>
                    <p className="mt-1 text-sm text-slate-400">Real-time utilization</p>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center py-10">
                    <div className="relative h-48 w-48">
                      <svg viewBox="0 0 100 50" className="h-full w-full">
                        <path
                          d="M 10 50 A 40 40 0 1 1 90 50"
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 1 1 90 50"
                          fill="transparent"
                          stroke="#1e293b"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray="125.6"
                          strokeDashoffset={125.6 * (1 - ((occupancy.occupancy_rate ?? 0) / 100))}
                        />
                      </svg>
                      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
                        <span className="text-4xl font-black text-slate-800">{occupancy.occupancy_rate ?? 0}%</span>
                        <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-sky-500">In Use</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-50 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Rooms Available</span>
                      <span className="text-xs font-bold tracking-tight text-slate-800">
                        {occupancy.rooms_available ?? 0} / {occupancy.rooms_total ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Active Bookings</span>
                      <span className="text-xs font-bold tracking-tight text-slate-800">{occupancy.active_bookings ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Total Reviews</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-[10px] text-slate-800">
                        {reviews.total_reviews ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
                <div className="mb-10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Reviews & Ratings Summary</h3>
                  <Link href="/reviews" className="text-sm font-bold text-sky-600 transition-colors hover:text-sky-700">View All Feedback</Link>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                  <div className="lg:col-span-3 flex flex-col items-center md:items-start">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-slate-800">
                        {Number(reviews.average_rating ?? 0).toFixed(1)}
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {reviews.total_reviews ?? 0} reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-9 space-y-4">
                    {["5", "4", "3", "2", "1"].map((star) => {
                      const count = Number(breakdown[star] ?? 0);
                      const total = Number(reviews.total_reviews ?? 0) || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-400">{star} star</span>
                            <span className="text-slate-600">{count}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-50">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
