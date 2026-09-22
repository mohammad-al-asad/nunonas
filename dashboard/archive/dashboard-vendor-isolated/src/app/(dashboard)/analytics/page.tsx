"use client";

import React, { useState, useEffect, useRef } from "react";
import { vendorGetAnalyticsOverview, vendorExportAnalytics } from "@/lib/vendor-api";

import { Header } from "@/components/Header";
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Bed,
  Star,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DatePicker } from "@/components/DatePicker";

interface StatItem {
  label: string;
  value: string;
  trend: string;
  trendType: "up" | "down";
  icon: any;
  color: string;
  bg: string;
}

const STATS: StatItem[] = [
  {
    label: "TOTAL BOOKINGS",
    value: "2,842",
    trend: "+12.5%",
    trendType: "up",
    icon: Calendar,
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
  {
    label: "TOTAL REVENUE",
    value: "$412,900",
    trend: "+8.2%",
    trendType: "up",
    icon: DollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    label: "OCCUPANCY RATE",
    value: "78.4%",
    trend: "-2.1%",
    trendType: "down",
    icon: Bed,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    label: "AVERAGE RATING",
    value: "4.8 / 5.0",
    trend: "+0.4",
    trendType: "up",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

interface ReviewItem {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  time: string;
  comment: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 5,
    time: "2 HOURS AGO",
    comment:
      "The service was exceptional from start to finish. The spa treatments were world-class and the staff was incredibly attentive. Highly recommended for a weekend getaway!",
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    rating: 4,
    time: "YESTERDAY",
    comment:
      "Great atmosphere at the restaurant. The menu options were creative and well-presented. Only slight delay in seating, but overall a fantastic experience.",
  },
];

export default function AnalyticsPage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [stats, setStats] = useState(STATS);
  const [exporting, setExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: new Date(2026, 0, 1),
    end: new Date(2026, 0, 31),
  });

  useEffect(() => {
    vendorGetAnalyticsOverview()
      .then((data) => {
        const d = data as Record<string, unknown>;
        if (d && Object.keys(d).length > 0) {
          setStats([
            {
              label: "TOTAL BOOKINGS",
              value: String(d.total_bookings ?? "—"),
              trend: (d.bookings_trend as string) ?? "+0%",
              trendType: (((d.bookings_trend as string) ?? "+").startsWith("-") ? "down" : "up") as "up" | "down",
              icon: STATS[0].icon,
              color: STATS[0].color,
              bg: STATS[0].bg,
            },
            {
              label: "TOTAL REVENUE",
              value: d.total_revenue != null ? `$${Number(d.total_revenue).toLocaleString()}` : "—",
              trend: (d.revenue_trend as string) ?? "+0%",
              trendType: (((d.revenue_trend as string) ?? "+").startsWith("-") ? "down" : "up") as "up" | "down",
              icon: STATS[1].icon,
              color: STATS[1].color,
              bg: STATS[1].bg,
            },
            {
              label: "OCCUPANCY RATE",
              value: d.occupancy_rate != null ? `${d.occupancy_rate}%` : "—",
              trend: (d.occupancy_trend as string) ?? "0%",
              trendType: (((d.occupancy_trend as string) ?? "+").startsWith("-") ? "down" : "up") as "up" | "down",
              icon: STATS[2].icon,
              color: STATS[2].color,
              bg: STATS[2].bg,
            },
            {
              label: "AVERAGE RATING",
              value: d.avg_rating != null ? `${Number(d.avg_rating).toFixed(1)} / 5.0` : "—",
              trend: (d.rating_trend as string) ?? "0",
              trendType: "up",
              icon: STATS[3].icon,
              color: STATS[3].color,
              bg: STATS[3].bg,
            },
          ]);
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  const handleExport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      await vendorExportAnalytics();
    } catch (err) {
      console.warn("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const rangeText =
    dateRange.start && dateRange.end
      ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd, yyyy")}`
      : dateRange.start
        ? `${format(dateRange.start, "MMM dd")} - Select End`
        : "Select Date Range";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Analytics" />

      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Business Analytics
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitoring performance across all property sectors
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={calendarRef}>
                <div
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">
                    {rangeText}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>

                {isCalendarOpen && (
                  <div className="absolute top-full right-0 mt-2 z-50">
                    <DatePicker
                      onClose={() => setIsCalendarOpen(false)}
                      selectedRange={dateRange}
                      onRangeChange={setDateRange}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 bg-[#1e2a5e] hover:bg-[#1a2552] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-slate-900/10 transition-all font-sans disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting…" : "Export Report"}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      stat.bg,
                      stat.color,
                    )}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-black",
                      stat.trendType === "up"
                        ? "text-emerald-500"
                        : "text-rose-500",
                    )}
                  >
                    {stat.trendType === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {stat.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Customer Demographics */}
            <div className="xl:col-span-2 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-10">
                Customer Demographics
              </h3>

              <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Donut Chart Placeholder - Semi-manual CSS Donut */}
                <div className="relative h-64 w-64 shrink-0">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-full w-full -rotate-90"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#eff6ff"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#38bdf8"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - 0.62)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      GENDER
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      DISTRIBUTION
                    </span>
                  </div>
                </div>

                {/* Age & Breakdown */}
                <div className="flex-1 w-full space-y-6">
                  {/* Legend */}
                  <div className="flex items-center gap-6 mb-10">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-sky-500" />
                      <span className="text-xs font-bold text-slate-600">
                        Female (62%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-sky-100" />
                      <span className="text-xs font-bold text-slate-400">
                        Male (38%)
                      </span>
                    </div>
                  </div>

                  {/* Age Bars */}
                  {[
                    { label: "18-25 YEARS", val: 15 },
                    { label: "26-40 YEARS", val: 48 },
                    { label: "41-60 YEARS", val: 24 },
                    { label: "60+ YEARS", val: 13 },
                  ].map((age, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black tracking-wider">
                        <span className="text-slate-400">{age.label}</span>
                        <span className="text-slate-600">{age.val}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-1000"
                          style={{ width: `${age.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Occupancy Tracking */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 h-full flex flex-col">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Occupancy Tracking
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Real-time utilization
                </p>
              </div>

              {/* Gauge */}
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <div className="relative h-48 w-48">
                  <svg viewBox="0 0 100 50" className="w-full h-full">
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
                      strokeDashoffset={125.6 * (1 - 0.82)}
                    />
                  </svg>
                  <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-800">
                      82%
                    </span>
                    <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-1">
                      IN USE
                    </span>
                  </div>
                </div>
              </div>

              {/* Status List */}
              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Rooms Available
                  </span>
                  <span className="text-xs font-bold text-slate-800 tracking-tight">
                    42 / 240
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Table Reservations
                  </span>
                  <span className="text-xs font-bold text-slate-800 tracking-tight">
                    12 Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Spa Capacity
                  </span>
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-widest text-[10px]">
                    High Load
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Summary */}
          <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-slate-800">
                Reviews & Ratings Summary
              </h3>
              <button className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors">
                View All Feedback
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Rating Big Number */}
              <div className="lg:col-span-3 flex flex-col items-center md:items-start">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-800">
                    4.8
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      1,240 REVIEWS
                    </span>
                  </div>
                </div>

                {/* Horizontal Rating Bars */}
                <div className="w-full mt-8 space-y-2">
                  {[
                    { s: 5, p: 75 },
                    { s: 4, p: 15 },
                    { s: 3, p: 6 },
                    { s: 2, p: 3 },
                    { s: 1, p: 1 },
                  ].map((r) => (
                    <div key={r.s} className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 w-2.5">
                        {r.s}
                      </span>
                      <div className="h-1.5 flex-1 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${r.p}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Feed */}
              <div className="lg:col-span-9 space-y-8">
                {REVIEWS.map((review) => (
                  <div key={review.id} className="flex gap-6 group">
                    <div className="h-12 w-12 rounded-2xl overflow-hidden shrink-0 ring-4 ring-slate-50 ring-offset-0">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          {review.name}
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {review.time}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200",
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
