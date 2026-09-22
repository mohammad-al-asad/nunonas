"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  FiShoppingBag,
  FiSmile,
  FiTag,
  FiUsers
} from "react-icons/fi";
import { FaStar } from "react-icons/fa6";

type Range = "weekly" | "monthly";

export type StatIcon = "tag" | "users" | "shopping_bag" | "calendar" | "smile";

export type DashboardData = {
  stats: Array<{ label: string; value: string; sub: string; trend: string; icon: StatIcon }>;
  monthlyData: Array<{ period: string; value: number }>;
  weeklyData: Array<{ period: string; value: number }>;
  bookingByRange: Record<Range, Array<{ name: string; value: number; color: string }>>;
  bookingTotals: Record<Range, number>;
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
  bookingByRange: {
    weekly: [],
    monthly: []
  },
  bookingTotals: {
    weekly: 0,
    monthly: 0
  },
  vendors: []
  ,details: {}, recentBookings: []
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
  const [vendorPage, setVendorPage] = useState(1);
  const [navigatingVendorId, setNavigatingVendorId] = useState<string | null>(null);
  const vendorPageSize = 10;

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
              monthly: nextData.bookingByRange?.monthly ?? prev.bookingByRange.monthly
            },
            bookingTotals: {
              weekly: nextData.bookingTotals?.weekly ?? prev.bookingTotals.weekly,
              monthly: nextData.bookingTotals?.monthly ?? prev.bookingTotals.monthly
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

  const revenueData = range === "weekly" ? liveData.weeklyData : liveData.monthlyData;
  const pieData = (liveData.bookingByRange?.[range]) ?? [];
  const bookingTotal = (liveData.bookingTotals?.[range]) ?? 0;
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

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {(liveData.stats ?? []).map((card) => {
          const CardIcon = statsIconMap[card.icon];
          return (
            <article key={card.label} className="rounded-xl border border-[#dbe2ef] bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#eef2fb] text-[#27409b]">
                  <CardIcon size={23} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-semibold text-[#17a765]">~{card.trend}</span>
              </div>
              <p className="m-0 mt-4 text-[12px] tracking-[0.04em] text-[#7a88a6]">{card.label}</p>
              <h3 className="m-0 mt-1 text-[42px] leading-none text-[#1f2b43]">{card.value}</h3>
              <p className="m-0 mt-2 text-[10px] text-[#97a3bc]">{card.sub}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Users", values: [["Total", details?.users?.total ?? 0], ["Active", details?.users?.active ?? 0]] },
          { title: "Vendors", values: [["Total", details?.vendors?.total ?? 0], ["Active", details?.vendors?.active ?? 0], ["Pending", details?.vendors?.pending ?? 0], ["Blocked", details?.vendors?.blocked ?? 0]] },
          { title: "Bookings", values: [["Total", details?.bookings?.total ?? 0], ["Pending", details?.bookings?.pending ?? 0], ["Confirmed", details?.bookings?.confirmed ?? 0], ["Completed", details?.bookings?.completed ?? 0], ["Cancelled", details?.bookings?.cancelled ?? 0]] },
          { title: "Offers", values: [["Total", details?.offers?.total ?? 0], ["Active", details?.offers?.active ?? 0], ["Inactive", details?.offers?.inactive ?? 0]] }
        ].map((group) => (
          <article key={group.title} className="rounded-xl border border-[#dbe2ef] bg-white p-4">
            <h3 className="m-0 mb-3 text-[16px] font-semibold text-[#1f2b43]">{group.title} details</h3>
            <div className="space-y-2">
              {group.values.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#7a88a6]">{label}</span><strong className="text-[#1f2b43]">{value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[2.2fr_1fr]">
        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 text-[32px] font-semibold text-[#1f2b43]">Revenue Growth Over Time</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setRange("weekly")}
                className={`rounded border px-3 py-1 text-[11px] ${range === "weekly" ? "border-[#8ca0d8] bg-[#eef2fb] text-[#27409b]" : "border-[#dbe2ef] bg-[#f5f7fc] text-[#667792]"}`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setRange("monthly")}
                className={`rounded border px-3 py-1 text-[11px] ${range === "monthly" ? "border-[#8ca0d8] bg-[#eef2fb] text-[#27409b]" : "border-[#dbe2ef] bg-[#f5f7fc] text-[#667792]"}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-[330px] w-full">
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={300}>
              <BarChart data={revenueData} margin={{ top: 12, right: 4, left: 0, bottom: 8 }} barGap={4}>
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9aa6c0", fontWeight: 700 }} />
                <YAxis hide />
                <Tooltip formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="value" fill="#bec5d8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
          <h3 className="m-0 mb-2 text-[32px] font-semibold text-[#1f2b43]">Booking Insights</h3>
          <div className="relative h-[240px] w-full">
            <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={0}>
                  {pieData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="m-0 text-[44px] font-semibold text-[#1f2b43]">{formatCompactNumber(bookingTotal)}</p>
                <p className="m-0 text-[11px] text-[#9aa6c0]">TOTAL</p>
              </div>
            </div>
          </div>
          <ul className="m-0 mt-2 list-none space-y-2 p-0 text-[14px]">
            {pieData.map((item) => (
              <li key={item.name} className="flex items-center justify-between text-[#5f6f8b]">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong className="text-[#2b3852]">{formatPercent(item.value)}%</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-[#dbe2ef] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 text-[34px] font-semibold text-[#1f2b43]">Vendor Performance Snapshot</h3>
          <Link href="/vendors" className="text-[13px] font-semibold text-[#2648a0]">View All Vendors</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-[14px]">
            <thead>
              <tr>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">VENDOR NAME</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">CATEGORY</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">RATINGS</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">REVENUE</th>
                <th className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#8b96ad]">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {pagedVendors.map((vendor, i) => (
                <tr key={`${vendor.id}-${vendor.code}-${i}`} className={i % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <button
                      type="button"
                      onClick={() => openVendorDetails(vendor.id)}
                      className="flex items-center gap-3 hover:opacity-85"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded bg-[#edf2fb] text-[11px] font-semibold text-[#415a91]">{vendor.code}</span>
                      <strong className="text-[#1f2b43] hover:text-[#2648a0]">{vendor.name}</strong>
                    </button>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4 text-[#6f7e98]">{vendor.category}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <span className="flex items-center gap-1 text-[#2b3852]"><FaStar size={11} className="text-[#f6b329]" /> {vendor.rating}</span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4 font-semibold text-[#2b3852]">{vendor.revenue}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <span className={`rounded px-2 py-1 text-[10px] font-semibold ${vendorStatusClass(vendor.status)}`}>{vendor.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>
            Showing {liveData.vendors.length === 0 ? 0 : (vendorPage - 1) * vendorPageSize + 1} to{" "}
            {Math.min(vendorPage * vendorPageSize, liveData.vendors.length)} of {liveData.vendors.length} vendors
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
        <div className="mb-3 flex items-center justify-between">
          <div><h3 className="m-0 text-[24px] font-semibold text-[#1f2b43]">Recent bookings</h3><p className="m-0 mt-1 text-[12px] text-[#8b96ad]">Latest booking activity across the platform.</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]"><thead><tr>
            {['CUSTOMER','VENDOR','TYPE','AMOUNT','STATUS','DATE'].map((label) => <th key={label} className="border-b border-[#edf1fa] px-3 py-2 text-left text-[10px] text-[#8b96ad]">{label}</th>)}
          </tr></thead><tbody>
            {(liveData.recentBookings ?? []).map((booking) => <tr key={booking.id}>
              <td className="border-b border-[#edf1fa] px-3 py-3 font-semibold text-[#1f2b43]">{booking.customer}</td><td className="border-b border-[#edf1fa] px-3 py-3 text-[#5f6f8b]">{booking.vendor}</td><td className="border-b border-[#edf1fa] px-3 py-3 text-[#5f6f8b]">{booking.type}</td><td className="border-b border-[#edf1fa] px-3 py-3 font-semibold text-[#2b3852]">${booking.amount.toFixed(2)}</td><td className="border-b border-[#edf1fa] px-3 py-3 text-[#5f6f8b]">{booking.status}</td><td className="border-b border-[#edf1fa] px-3 py-3 text-[#8b96ad]">{booking.date}</td>
            </tr>)}
          </tbody></table>
          {!liveData.recentBookings?.length && <p className="m-0 py-8 text-center text-[13px] text-[#8b96ad]">No bookings found.</p>}
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

