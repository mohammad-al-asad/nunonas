"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardVendor } from "@/lib/vendors-admin";

// Same single hue as the revenue chart; other categories recede when one is selected.
const BAR_COLOR = "#2f55c8";
const BAR_MUTED = "#c9d4f2";
const GRID_COLOR = "#eef2f7";
const AXIS_TEXT = "#8b96ad";
const VALUE_TEXT = "#475569";
const ROW_HEIGHT = 44;

type Point = { category: string; count: number; approved: number };

function countByCategory(vendors: DashboardVendor[]): Point[] {
  const counts = new Map<string, Point>();
  for (const vendor of vendors) {
    const point = counts.get(vendor.category) ?? { category: vendor.category, count: 0, approved: 0 };
    point.count += 1;
    if (vendor.status === "APPROVED") point.approved += 1;
    counts.set(vendor.category, point);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg bg-[#0f172a] px-3 py-2 text-white shadow-lg">
      <p className="m-0 text-[15px] font-semibold tabular-nums">
        {point.count.toLocaleString()} {point.count === 1 ? "provider" : "providers"}
      </p>
      <p className="m-0 mt-0.5 text-[11px] text-[#cbd5e1]">
        {point.category} · {point.approved.toLocaleString()} approved
      </p>
    </div>
  );
}

export function CategoryCountChart({
  vendors,
  categoryFilter,
  onSelectCategory,
}: {
  vendors: DashboardVendor[];
  categoryFilter: "ALL" | string;
  onSelectCategory: (category: "ALL" | string) => void;
}) {
  const data = useMemo(() => countByCategory(vendors), [vendors]);
  const isSelected = (category: string) => categoryFilter.toLowerCase() === category.toLowerCase();
  const leader = data[0];
  const takeaway = leader
    ? `${leader.category} has the most providers (${leader.count.toLocaleString()} of ${vendors.length.toLocaleString()}) · click a bar to filter`
    : "No service providers yet";

  return (
    <section className="rounded-xl border border-[#e6ecf7] bg-white p-5 shadow-sm">
      <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Providers by category</h3>
      <p className="m-0 mt-1 text-[12px] text-[#70809d]">{takeaway}</p>
      {data.length > 0 && (
        <div className="mt-3 w-full" style={{ height: data.length * ROW_HEIGHT + 16 }} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
              <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="category"
                width={96}
                tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5fb" }} />
              <Bar
                dataKey="count"
                maxBarSize={24}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
                className="cursor-pointer"
                onClick={(entry) => {
                  const category = (entry as unknown as Point).category;
                  onSelectCategory(isSelected(category) ? "ALL" : category);
                }}
              >
                {data.map((point) => (
                  <Cell
                    key={point.category}
                    fill={categoryFilter === "ALL" || isSelected(point.category) ? BAR_COLOR : BAR_MUTED}
                  />
                ))}
                <LabelList dataKey="count" position="right" fill={VALUE_TEXT} fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Same numbers as a table for screen readers. */}
      <table className="sr-only">
        <caption>Providers by category</caption>
        <tbody>
          {data.map((point) => (
            <tr key={point.category}>
              <th scope="row">{point.category}</th>
              <td>{point.count} providers</td>
              <td>{point.approved} approved</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
