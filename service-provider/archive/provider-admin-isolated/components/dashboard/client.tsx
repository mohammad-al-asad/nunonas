"use client";

import { useState } from "react";
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
  vendors: Array<{ code: string; name: string; category: string; rating: string; revenue: string; status: string }>;
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
  const [range, setRange] = useState<Range>("monthly");
  const [vendorPage, setVendorPage] = useState(1);
  const vendorPageSize = 10;

  const revenueData = range === "weekly" ? data.weeklyData : data.monthlyData;
  const pieData = (data.bookingByRange?.[range]) ?? [];
  const bookingTotal = (data.bookingTotals?.[range]) ?? 0;
  const vendorTotalPages = Math.max(1, Math.ceil((data.vendors?.length ?? 0) / vendorPageSize));
  const pagedVendors = (data.vendors ?? []).slice((vendorPage - 1) * vendorPageSize, vendorPage * vendorPageSize);

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {(data.stats ?? []).map((card) => {
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
                <YAxis hide domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value ?? 0}`, "Index"]} />
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
          <a href="#" className="text-[13px] font-semibold text-[#2648a0]">View All Vendors</a>
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
                <tr key={`${vendor.code}-${vendor.name}-${i}`} className={i % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded bg-[#edf2fb] text-[11px] font-semibold text-[#415a91]">{vendor.code}</span>
                      <strong className="text-[#1f2b43]">{vendor.name}</strong>
                    </div>
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
            Showing {data.vendors.length === 0 ? 0 : (vendorPage - 1) * vendorPageSize + 1} to{" "}
            {Math.min(vendorPage * vendorPageSize, data.vendors.length)} of {data.vendors.length} vendors
          </span>
          <div className="flex items-center gap-2">
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
    </section>
  );
}

