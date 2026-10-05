"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardVendor } from "@/lib/vendors-admin";

export type RevenueBreakdown = {
  totalRevenue: number;
  byType: Array<{ type: string; label: string; revenue: number; bookings: number }>;
  byVendor: Array<{ vendorId: string; revenue: number; bookings: number }>;
};

// Single-series bars: one brand-blue hue (validated: lightness band, chroma, contrast vs white).
const BAR_COLOR = "#2f55c8";
const GRID_COLOR = "#eef2f7";
const AXIS_TEXT = "#8b96ad";
const VALUE_TEXT = "#475569";
const TOP_PROVIDERS = 5;
const ROW_HEIGHT = 44;

type Point = { label: string; revenue: number; bookings: number; share: number };

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatShare(share: number) {
  return share > 0 && share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`;
}

function withShares(rows: Array<Omit<Point, "share">>): Point[] {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  return rows
    .filter((row) => row.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((row) => ({ ...row, share: total > 0 ? row.revenue / total : 0 }));
}

function byProviderType(revenue: RevenueBreakdown): Point[] {
  return withShares(revenue.byType.map(({ label, revenue: amount, bookings }) => ({ label, revenue: amount, bookings })));
}

function byProviderInCategory(revenue: RevenueBreakdown, vendors: DashboardVendor[], category: string): Point[] {
  const revenueByVendor = new Map(revenue.byVendor.map((row) => [row.vendorId, row]));
  const rows = withShares(
    vendors
      .filter((vendor) => vendor.category.toLowerCase() === category.toLowerCase())
      .map((vendor) => {
        const row = revenueByVendor.get(vendor.id);
        return { label: vendor.businessName, revenue: row?.revenue ?? 0, bookings: row?.bookings ?? 0 };
      }),
  );
  if (rows.length <= TOP_PROVIDERS + 1) return rows;

  // Keep the chart readable: top providers, then everything else folded into one bar.
  const rest = rows.slice(TOP_PROVIDERS);
  return [
    ...rows.slice(0, TOP_PROVIDERS),
    {
      label: `Other (${rest.length})`,
      revenue: rest.reduce((sum, row) => sum + row.revenue, 0),
      bookings: rest.reduce((sum, row) => sum + row.bookings, 0),
      share: rest.reduce((sum, row) => sum + row.share, 0),
    },
  ];
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg bg-[#0f172a] px-3 py-2 text-white shadow-lg">
      <p className="m-0 text-[15px] font-semibold tabular-nums">{formatMoney(point.revenue)}</p>
      <p className="m-0 mt-0.5 text-[11px] text-[#cbd5e1]">
        {point.label} · {formatShare(point.share)} of revenue · {point.bookings.toLocaleString()}{" "}
        {point.bookings === 1 ? "booking" : "bookings"}
      </p>
    </div>
  );
}

export function RevenueContributionChart({
  revenue,
  vendors,
  categoryFilter,
}: {
  revenue: RevenueBreakdown;
  vendors: DashboardVendor[];
  categoryFilter: "ALL" | string;
}) {
  const isAll = categoryFilter === "ALL";
  const data = useMemo(
    () =>
      (isAll ? byProviderType(revenue) : byProviderInCategory(revenue, vendors, categoryFilter)).map((point) => ({
        ...point,
        valueLabel: `${formatMoney(point.revenue)} · ${formatShare(point.share)}`,
      })),
    [categoryFilter, isAll, revenue, vendors],
  );

  const total = data.reduce((sum, point) => sum + point.revenue, 0);
  const title = isAll ? "Revenue by provider type" : `Revenue by ${categoryFilter.toLowerCase()} provider`;
  const leader = data[0];
  const takeaway = leader
    ? `${leader.label} ${isAll ? "bring" : "brings"} in ${formatShare(leader.share)} of ${formatMoney(total)}${isAll ? "" : ` from ${categoryFilter.toLowerCase()}s`}`
    : isAll
      ? "No revenue from confirmed bookings yet"
      : `No revenue from ${categoryFilter.toLowerCase()} providers yet`;

  return (
    <section className="rounded-xl border border-[#e6ecf7] bg-white p-5 shadow-sm">
      <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">{title}</h3>
      <p className="m-0 mt-1 text-[12px] text-[#70809d]">{takeaway}</p>
      {data.length > 0 && (
        <div className="mt-3 w-full" style={{ height: data.length * ROW_HEIGHT + 16 }} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 120, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5fb" }} />
              <Bar dataKey="revenue" fill={BAR_COLOR} maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="valueLabel" position="right" fill={VALUE_TEXT} fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Same numbers as a table for screen readers. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{formatMoney(point.revenue)}</td>
              <td>{formatShare(point.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
