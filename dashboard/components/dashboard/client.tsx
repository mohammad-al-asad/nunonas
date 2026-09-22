"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiShoppingBag,
  FiSmile,
  FiTag,
  FiUsers
} from "react-icons/fi";
import { FaStar } from "react-icons/fa6";

type Range = "weekly" | "monthly" | "custom";

export type StatIcon = "tag" | "users" | "shopping_bag" | "calendar" | "smile";

export type DashboardData = {
  stats: Array<{ label: string; value: string; sub: string; trend: string; icon: StatIcon }>;
  monthlyData: Array<{ period: string; value: number }>;
  weeklyData: Array<{ period: string; value: number }>;
  customData?: Array<{ period: string; value: number }>;
  bookingByRange: {
    weekly: Array<{ name: string; value: number; color: string }>;
    monthly: Array<{ name: string; value: number; color: string }>;
    custom?: Array<{ name: string; value: number; color: string }>;
  };
  bookingTotals: {
    weekly: number;
    monthly: number;
    custom?: number;
  };
  vendors: Array<{ id: string; code: string; name: string; category: string; rating: string; revenue: string; status: string }>;
  details?: {
    users?: { total: number; active: number };
    vendors?: { total: number; active: number; pending: number; blocked: number };
    bookings?: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
    offers?: { total: number; active: number; inactive: number };
  };
  recentBookings?: Array<{ id: string; customer: string; vendor: string; type: string; amount: number; status: string; date: string }>;
};

const EMPTY_DATA: DashboardData = {
  stats: [],
  monthlyData: [],
  weeklyData: [],
  customData: [],
  bookingByRange: {
    weekly: [],
    monthly: [],
    custom: []
  },
  bookingTotals: {
    weekly: 0,
    monthly: 0,
    custom: 0
  },
  vendors: [],
  details: {},
  recentBookings: []
};

const statsIconMap: Record<StatIcon, typeof FiTag> = {
  tag: FiTag,
  users: FiUsers,
  shopping_bag: FiShoppingBag,
  calendar: FiCalendar,
  smile: FiSmile
};

function vendorStatusClass(status: string) {
  if (status === "TOP PERFORMER") return "bg-[#dcf7ea] text-[#137f56]";
  if (status === "AT RISK") return "bg-[#ffeecf] text-[#ae6a09]";
  return "bg-[#e0ebff] text-[#2456a9]";
}

function bookingCategoryBadgeClass(category: string) {
  const norm = category.toLowerCase();
  if (norm.includes("restaurant") || norm.includes("food") || norm.includes("dining")) {
    return "bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe]";
  }
  if (norm.includes("event") || norm.includes("party") || norm.includes("concert")) {
    return "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]";
  }
  if (norm.includes("hotel") || norm.includes("resort") || norm.includes("stay")) {
    return "bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]";
  }
  if (norm.includes("spa") || norm.includes("wellness") || norm.includes("massage") || norm.includes("salon")) {
    return "bg-[#faf5ff] text-[#7e22ce] border border-[#e9d5ff]";
  }
  if (norm.includes("tour") || norm.includes("activity") || norm.includes("fitness") || norm.includes("gym")) {
    return "bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]";
  }
  return "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]";
}

function bookingStatusBadgeClass(status: string, category?: string) {
  const norm = status.toLowerCase();
  if (norm.includes("confirm") || norm.includes("complete") || norm.includes("success") || norm.includes("approved")) {
    return "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]";
  }
  if (norm.includes("pend") || norm.includes("wait") || norm.includes("review")) {
    return "bg-[#fef3c7] text-[#b45309] border border-[#fde68a]";
  }
  if (norm.includes("cancel") || norm.includes("reject") || norm.includes("fail") || norm.includes("declined")) {
    return "bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]";
  }
  if (norm.includes("progress") || norm.includes("process") || norm.includes("active")) {
    return "bg-[#e0e7ff] text-[#1d4ed8] border border-[#c7d2fe]";
  }
  if (category) {
    return bookingCategoryBadgeClass(category);
  }
  return "bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]";
}

function bookingStatusDotClass(status: string) {
  const norm = status.toLowerCase();
  if (norm.includes("confirm") || norm.includes("complete") || norm.includes("success") || norm.includes("approved")) {
    return "bg-[#16a34a]";
  }
  if (norm.includes("pend") || norm.includes("wait") || norm.includes("review")) {
    return "bg-[#d97706]";
  }
  if (norm.includes("cancel") || norm.includes("reject") || norm.includes("fail") || norm.includes("declined")) {
    return "bg-[#dc2626]";
  }
  if (norm.includes("progress") || norm.includes("process") || norm.includes("active")) {
    return "bg-[#2563eb]";
  }
  return "bg-[#64748b]";
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return `${value}`;
}

function formatPercent(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function DashboardView({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [liveData, setLiveData] = useState<DashboardData>(data ?? EMPTY_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>("monthly");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [customData, setCustomData] = useState<Array<{ period: string; value: number }>>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [vendorPage, setVendorPage] = useState(1);
  const [navigatingVendorId, setNavigatingVendorId] = useState<string | null>(null);
  const [selectedBookingCategory, setSelectedBookingCategory] = useState<string>("ALL");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<string>("ALL");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const pieAnimatedRef = useRef(false);
  const vendorPageSize = 10;

  useEffect(() => {
    const timeout = setTimeout(() => {
      pieAnimatedRef.current = true;
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest("[data-booking-category-dropdown]")) {
        setCategoryDropdownOpen(false);
      }
      if (target && !target.closest("[data-booking-status-dropdown]")) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setLiveData(data ?? EMPTY_DATA);
  }, [data]);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      setRefreshing(true);
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const nextData = (await response.json()) as DashboardData;
        if (active) {
          setLiveData((prev) => ({
            ...prev,
            ...nextData,
            bookingByRange: {
              weekly: nextData.bookingByRange?.weekly ?? prev.bookingByRange.weekly,
              monthly: nextData.bookingByRange?.monthly ?? prev.bookingByRange.monthly,
              custom: nextData.bookingByRange?.custom ?? prev.bookingByRange.custom ?? nextData.bookingByRange?.monthly ?? []
            },
            bookingTotals: {
              weekly: nextData.bookingTotals?.weekly ?? prev.bookingTotals.weekly,
              monthly: nextData.bookingTotals?.monthly ?? prev.bookingTotals.monthly,
              custom: nextData.bookingTotals?.custom ?? prev.bookingTotals.custom ?? nextData.bookingTotals?.monthly ?? 0
            }
          }));
        }
      } catch {
        // Keep the previous snapshot if the refresh fails.
      } finally {
        if (active) setRefreshing(false);
      }
    };

    refresh();
    const timer = setInterval(refresh, 30000);

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (range !== "custom") return;
    let active = true;

    const fetchCustom = async () => {
      setLoadingCustom(true);
      try {
        const response = await fetch(
          `/api/dashboard?start_date=${encodeURIComponent(customStartDate)}&end_date=${encodeURIComponent(customEndDate)}`,
          { cache: "no-store" }
        );
        if (response.ok) {
          const nextData = (await response.json()) as DashboardData;
          if (active && nextData.customData && nextData.customData.length > 0) {
            setCustomData(nextData.customData);
            return;
          }
        }
      } catch {
        // fallback to client-side empty range
      } finally {
        if (active) setLoadingCustom(false);
      }

      if (active) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const fallback: Array<{ period: string; value: number }> = [];
        for (let i = 0; i < Math.min(diffDays, 31); i++) {
          const cur = new Date(start);
          cur.setDate(start.getDate() + i);
          fallback.push({
            period: cur.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: 0
          });
        }
        setCustomData(fallback);
      }
    };

    void fetchCustom();
    return () => {
      active = false;
    };
  }, [range, customStartDate, customEndDate]);

  const revenueData =
    range === "weekly"
      ? liveData.weeklyData
      : range === "monthly"
        ? liveData.monthlyData
        : customData;

  const pieData = (liveData.bookingByRange?.[range]) ?? (liveData.bookingByRange?.monthly) ?? [];
  const bookingTotal = (liveData.bookingTotals?.[range]) ?? (liveData.bookingTotals?.monthly) ?? 0;
  const vendorTotalPages = Math.max(1, Math.ceil((liveData.vendors?.length ?? 0) / vendorPageSize));
  const pagedVendors = (liveData.vendors ?? []).slice((vendorPage - 1) * vendorPageSize, vendorPage * vendorPageSize);
  const details = liveData.details ?? EMPTY_DATA.details;

  useEffect(() => {
    setVendorPage(1);
  }, [liveData.vendors.length]);

  const openVendorDetails = (vendorId: string) => {
    setNavigatingVendorId(vendorId);
    window.requestAnimationFrame(() => {
      router.push(`/vendors/${vendorId}`);
    });
  };

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (liveData.recentBookings ?? []).forEach((b) => {
      if (b.type) set.add(b.type);
    });
    return Array.from(set);
  }, [liveData.recentBookings]);

  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    (liveData.recentBookings ?? []).forEach((b) => {
      if (b.status) set.add(b.status);
    });
    return Array.from(set);
  }, [liveData.recentBookings]);

  const filteredRecentBookings = useMemo(() => {
    const list = liveData.recentBookings ?? [];
    return list.filter((b) => {
      const matchesCategory =
        selectedBookingCategory === "ALL" ||
        b.type.toLowerCase() === selectedBookingCategory.toLowerCase();
      const matchesStatus =
        selectedBookingStatus === "ALL" ||
        b.status.toLowerCase() === selectedBookingStatus.toLowerCase();
      return matchesCategory && matchesStatus;
    });
  }, [liveData.recentBookings, selectedBookingCategory, selectedBookingStatus]);

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {(liveData.stats ?? []).map((card) => {
          const CardIcon = statsIconMap[card.icon];
          const displayLabel = card.label.replace(/VENDORS/gi, "SERVICE PROVIDERS");
          return (
            <article key={card.label} className="rounded-xl border border-[#dbe2ef] bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#eef2fb] text-[#27409b]">
                  <CardIcon size={23} strokeWidth={2.2} />
                </div>
                <span className="text-[12px] font-semibold text-[#18a979]">{card.trend}</span>
              </div>
              <p className="m-0 mt-3 text-[11px] font-semibold text-[#8b96ad]">{displayLabel}</p>
              <h4 className="m-0 mt-1 text-[31px] font-semibold tracking-[-0.03em] text-[#1d2a43]">{card.value}</h4>
              <p className="m-0 mt-1 text-[12px] text-[#8b96ad]">{card.sub}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <h4 className="m-0 text-[14px] font-semibold text-[#1f2b43]">Users details</h4>
          <div className="mt-3 space-y-2 text-[12px]">
            <div className="flex justify-between text-[#7d8ca7]"><span>Total</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.users?.total ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Active</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.users?.active ?? 0)}</strong></div>
          </div>
        </article>
        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <h4 className="m-0 text-[14px] font-semibold text-[#1f2b43]">Service Providers details</h4>
          <div className="mt-3 space-y-2 text-[12px]">
            <div className="flex justify-between text-[#7d8ca7]"><span>Total</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.vendors?.total ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Active</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.vendors?.active ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Pending</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.vendors?.pending ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Blocked</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.vendors?.blocked ?? 0)}</strong></div>
          </div>
        </article>
        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <h4 className="m-0 text-[14px] font-semibold text-[#1f2b43]">Bookings details</h4>
          <div className="mt-3 space-y-2 text-[12px]">
            <div className="flex justify-between text-[#7d8ca7]"><span>Total</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.bookings?.total ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Pending</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.bookings?.pending ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Confirmed</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.bookings?.confirmed ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Completed</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.bookings?.completed ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Cancelled</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.bookings?.cancelled ?? 0)}</strong></div>
          </div>
        </article>
        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <h4 className="m-0 text-[14px] font-semibold text-[#1f2b43]">Offers details</h4>
          <div className="mt-3 space-y-2 text-[12px]">
            <div className="flex justify-between text-[#7d8ca7]"><span>Total</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.offers?.total ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Active</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.offers?.active ?? 0)}</strong></div>
            <div className="flex justify-between text-[#7d8ca7]"><span>Inactive</span><strong className="text-[#1f2b43]">{formatCompactNumber(details?.offers?.inactive ?? 0)}</strong></div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-2xl border border-[#dbe2ef] bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="m-0 text-[26px] font-semibold tracking-[-0.03em] text-[#1f2b43]">Revenue Growth Over Time</h3>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#dbe2ef] bg-[#f8fafc] p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setRange("weekly")}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  range === "weekly"
                    ? "bg-[#1f3d8f] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#1f2b43]"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setRange("monthly")}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  range === "monthly"
                    ? "bg-[#1f3d8f] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#1f2b43]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setRange("custom")}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  range === "custom"
                    ? "bg-[#1f3d8f] text-white shadow-sm"
                    : "text-[#64748b] hover:text-[#1f2b43]"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {range === "custom" && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#475569]">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1 text-[12px] font-medium text-[#1e293b] shadow-sm outline-none focus:border-[#1f3d8f]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#475569]">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1 text-[12px] font-medium text-[#1e293b] shadow-sm outline-none focus:border-[#1f3d8f]"
                />
              </div>
              {loadingCustom && (
                <span className="text-[11px] font-medium text-[#1f3d8f] animate-pulse">
                  Updating range...
                </span>
              )}
            </div>
          )}

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="period" tick={{ fill: "#8b96ad", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#8b96ad", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `$${val / 1000}k` : `$${val}`)}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", border: "none" }}
                />
                <Bar dataKey="value" fill="#b9c4d8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-[#dbe2ef] bg-white p-5">
          <h3 className="m-0 text-[26px] font-semibold tracking-[-0.03em] text-[#1f2b43]">Booking Insights</h3>
          <div className="relative my-2 flex h-[210px] items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={58} outerRadius={82} strokeWidth={0} isAnimationActive={!pieAnimatedRef.current}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute text-center">
              <span className="text-[34px] font-semibold leading-none text-[#1f2b43]">{bookingTotal}</span>
              <p className="m-0 mt-1 text-[9px] uppercase tracking-[0.08em] text-[#8b96ad]">Total</p>
            </div>
          </div>
          <div className="space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#5b6e92]">{item.name}</span>
                </div>
                <strong className="text-[#1f2b43]">{formatPercent(item.value)}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#dbe2ef] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 text-[24px] font-semibold text-[#1f2b43]">Service Provider Performance Snapshot</h3>
          <button
            type="button"
            onClick={() => router.push("/vendors")}
            className="text-[12px] font-semibold text-[#27409b] hover:underline"
          >
            View All Service Providers
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr>
                {["SERVICE PROVIDER NAME", "CATEGORY", "RATINGS", "REVENUE", "STATUS"].map((label) => (
                  <th key={label} className="border-b border-[#edf1fa] px-3 py-2 text-left text-[10px] text-[#8b96ad]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedVendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  onClick={() => openVendorDetails(vendor.id)}
                  className="cursor-pointer transition-colors hover:bg-[#f6f9ff]"
                >
                  <td className="border-b border-[#edf1fa] px-3 py-3 font-semibold text-[#1f2b43]">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf2fb] text-[11px] font-semibold text-[#2648a0]">
                        {vendor.code}
                      </div>
                      <span className="text-[13px]">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-3 py-3 text-[#5f6f8b]">{vendor.category}</td>
                  <td className="border-b border-[#edf1fa] px-3 py-3 text-[#1f2b43]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#f59e0b]">
                      <FaStar size={11} /> {vendor.rating}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-3 py-3 font-semibold text-[#2b3852]">{vendor.revenue}</td>
                  <td className="border-b border-[#edf1fa] px-3 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${vendorStatusClass(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-3 flex items-center justify-between text-[11px] text-[#8b96ad]">
          <span>
            Showing {liveData.vendors.length === 0 ? 0 : (vendorPage - 1) * vendorPageSize + 1} to{" "}
            {Math.min(vendorPage * vendorPageSize, liveData.vendors.length)} of {liveData.vendors.length} service providers
          </span>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-[10px] text-[#9aa6c0]">
              {refreshing ? "Refreshing live data..." : "Live"}
            </span>
            <button
              type="button"
              onClick={() => setVendorPage((prev) => Math.max(1, prev - 1))}
              className={`rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] ${
                vendorPage === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={vendorPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: vendorTotalPages }, (_, idx) => idx + 1)
              .slice(0, 5)
              .map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setVendorPage(pageNumber)}
                  className={`h-6 w-6 rounded text-[11px] ${
                    pageNumber === vendorPage
                      ? "bg-[#1f3d8f] text-white"
                      : "border border-[#e6ecf7] text-[#64748b]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            {vendorTotalPages > 5 && <span className="px-1 text-[10px] text-[#94a3b8]">...</span>}
            {vendorTotalPages > 5 && (
              <button
                type="button"
                onClick={() => setVendorPage(vendorTotalPages)}
                className={`h-6 w-6 rounded text-[11px] ${
                  vendorTotalPages === vendorPage
                    ? "bg-[#1f3d8f] text-white"
                    : "border border-[#e6ecf7] text-[#64748b]"
                }`}
              >
                {vendorTotalPages}
              </button>
            )}
            <button
              type="button"
              onClick={() => setVendorPage((prev) => Math.min(vendorTotalPages, prev + 1))}
              className={`rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] ${
                vendorPage === vendorTotalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={vendorPage === vendorTotalPages}
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      <section className="rounded-xl border border-[#dbe2ef] bg-white p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="m-0 text-[24px] font-semibold text-[#1f2b43]">Recent bookings</h3>
            <p className="m-0 mt-1 text-[12px] text-[#8b96ad]">Latest booking activity across the platform.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2" data-booking-category-dropdown>
              <span className="text-[11px] font-medium text-[#7184a4]">Category:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryDropdownOpen((prev) => !prev);
                    setStatusDropdownOpen(false);
                  }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-medium transition-colors ${
                    selectedBookingCategory !== "ALL"
                      ? "border-[#1f3d8f] bg-[#eef2ff] text-[#1f3d8f]"
                      : "border-[#dbe2ef] bg-[#f8fafc] text-[#4e5f83] hover:bg-white"
                  }`}
                >
                  <FiFilter size={11} className={selectedBookingCategory !== "ALL" ? "text-[#1f3d8f]" : "text-[#8b96ad]"} />
                  <span>{selectedBookingCategory === "ALL" ? "All Categories" : selectedBookingCategory}</span>
                  <FiChevronDown size={11} className="text-[#8b96ad]" />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[#e6ecf7] bg-white py-1 shadow-lg shadow-slate-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingCategory("ALL");
                        setCategoryDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                        selectedBookingCategory === "ALL"
                          ? "bg-[#edf2fb] font-semibold text-[#1f3d8f]"
                          : "text-[#334155]"
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="text-[10px] text-[#8b96ad]">
                        {liveData.recentBookings?.length ?? 0}
                      </span>
                    </button>
                    {availableCategories.map((cat) => {
                      const count = (liveData.recentBookings ?? []).filter(
                        (b) => b.type.toLowerCase() === cat.toLowerCase()
                      ).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedBookingCategory(cat);
                            setCategoryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                            selectedBookingCategory.toLowerCase() === cat.toLowerCase()
                              ? "bg-[#edf2fb] font-semibold text-[#1f3d8f]"
                              : "text-[#334155]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                cat.toLowerCase().includes("restaurant")
                                  ? "bg-[#2563eb]"
                                  : cat.toLowerCase().includes("event")
                                    ? "bg-[#10b981]"
                                    : cat.toLowerCase().includes("hotel")
                                      ? "bg-[#0284c7]"
                                      : cat.toLowerCase().includes("spa")
                                        ? "bg-[#9333ea]"
                                        : "bg-[#64748b]"
                              }`}
                            />
                            <span>{cat}</span>
                          </div>
                          <span className="text-[10px] text-[#8b96ad]">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2" data-booking-status-dropdown>
              <span className="text-[11px] font-medium text-[#7184a4]">Status:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setStatusDropdownOpen((prev) => !prev);
                    setCategoryDropdownOpen(false);
                  }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-medium transition-colors ${
                    selectedBookingStatus !== "ALL"
                      ? "border-[#1f3d8f] bg-[#eef2ff] text-[#1f3d8f]"
                      : "border-[#dbe2ef] bg-[#f8fafc] text-[#4e5f83] hover:bg-white"
                  }`}
                >
                  <FiFilter size={11} className={selectedBookingStatus !== "ALL" ? "text-[#1f3d8f]" : "text-[#8b96ad]"} />
                  <span>{selectedBookingStatus === "ALL" ? "All Statuses" : selectedBookingStatus}</span>
                  <FiChevronDown size={11} className="text-[#8b96ad]" />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[#e6ecf7] bg-white py-1 shadow-lg shadow-slate-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingStatus("ALL");
                        setStatusDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                        selectedBookingStatus === "ALL"
                          ? "bg-[#edf2fb] font-semibold text-[#1f3d8f]"
                          : "text-[#334155]"
                      }`}
                    >
                      <span>All Statuses</span>
                      <span className="text-[10px] text-[#8b96ad]">
                        {liveData.recentBookings?.length ?? 0}
                      </span>
                    </button>
                    {availableStatuses.map((st) => {
                      const count = (liveData.recentBookings ?? []).filter(
                        (b) => b.status.toLowerCase() === st.toLowerCase()
                      ).length;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setSelectedBookingStatus(st);
                            setStatusDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                            selectedBookingStatus.toLowerCase() === st.toLowerCase()
                              ? "bg-[#edf2fb] font-semibold text-[#1f3d8f]"
                              : "text-[#334155]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${bookingStatusDotClass(st)}`}
                            />
                            <span>{st}</span>
                          </div>
                          <span className="text-[10px] text-[#8b96ad]">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr>
                {["CUSTOMER", "SERVICE PROVIDER", "TYPE", "AMOUNT", "STATUS", "DATE"].map((label) => (
                  <th key={label} className="border-b border-[#edf1fa] px-3 py-2 text-left text-[10px] text-[#8b96ad]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecentBookings.map((booking) => (
                <tr key={booking.id} className="transition-colors hover:bg-[#fcfdfe]">
                  <td className="border-b border-[#edf1fa] px-3 py-3 font-semibold text-[#1f2b43]">{booking.customer}</td>
                  <td className="border-b border-[#edf1fa] px-3 py-3 text-[#5f6f8b]">{booking.vendor}</td>
                  <td className="border-b border-[#edf1fa] px-3 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${bookingCategoryBadgeClass(booking.type)}`}>
                      {booking.type}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-3 py-3 font-semibold text-[#2b3852]">${booking.amount.toFixed(2)}</td>
                  <td className="border-b border-[#edf1fa] px-3 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${bookingStatusBadgeClass(booking.status, booking.type)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-3 py-3 text-[#8b96ad]">{booking.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRecentBookings.length && (
            <p className="m-0 py-8 text-center text-[13px] text-[#8b96ad]">
              {selectedBookingCategory === "ALL" && selectedBookingStatus === "ALL"
                ? "No bookings found."
                : "No bookings found matching the selected filters."}
            </p>
          )}
        </div>
      </section>

      {navigatingVendorId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1f3d8f] border-t-transparent" />
        </div>
      ) : null}
    </section>
  );
}

