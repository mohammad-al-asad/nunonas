"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { UserProfile } from "@/components/main/users-management-types";

// Single-series bars: one brand-blue hue (validated: lightness band, chroma, contrast vs white).
const BAR_COLOR = "#2f55c8";
const GRID_COLOR = "#eef2f7";
const AXIS_TEXT = "#8b96ad";
const VALUE_TEXT = "#475569";
const MONTHS_SHOWN = 6;

const BOOKING_BUCKETS = [
  { label: "No bookings", min: 0, max: 0 },
  { label: "1–2", min: 1, max: 2 },
  { label: "3–5", min: 3, max: 5 },
  { label: "6+", min: 6, max: Infinity },
];

type Point = { label: string; detail: string; value: number };

function monthlySignups(users: UserProfile[], now = new Date()): Point[] {
  const months = Array.from({ length: MONTHS_SHOWN }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-US", { month: "short" }),
      detail: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
      value: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const user of users) {
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const month = byKey.get(`${created.getFullYear()}-${created.getMonth()}`);
    if (month) month.value += 1;
  }
  return months.map(({ label, detail, value }) => ({ label, detail, value }));
}

function bookingActivity(users: UserProfile[]): Point[] {
  return BOOKING_BUCKETS.map((bucket) => ({
    label: bucket.label,
    detail: bucket.min === 0 && bucket.max === 0 ? "Users with no bookings" : `Users with ${bucket.label} bookings`,
    value: users.filter((user) => user.totalBookings >= bucket.min && user.totalBookings <= bucket.max).length,
  }));
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg bg-[#0f172a] px-3 py-2 text-white shadow-lg">
      <p className="m-0 text-[15px] font-semibold tabular-nums">
        {point.value.toLocaleString()} {point.value === 1 ? "user" : "users"}
      </p>
      <p className="m-0 mt-0.5 text-[11px] text-[#cbd5e1]">{point.detail}</p>
    </div>
  );
}

function ChartCard({ title, takeaway, data, emptyText }: { title: string; takeaway: string; data: Point[]; emptyText: string }) {
  const hasData = data.some((point) => point.value > 0);
  return (
    <article className="rounded-xl border border-[#dbe2ef] bg-white p-4">
      <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">{title}</h3>
      <p className="m-0 mt-1 text-[12px] text-[#70809d]">{hasData ? takeaway : emptyText}</p>
      <div className="mt-3 h-[200px] w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_COLOR} />
            <XAxis dataKey="label" tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5fb" }} />
            <Bar dataKey="value" fill={BAR_COLOR} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="value" position="top" fill={VALUE_TEXT} fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Same numbers as a table for screen readers. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.detail}</th>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

export function UsersCharts({ users }: { users: UserProfile[] }) {
  const signups = useMemo(() => monthlySignups(users), [users]);
  const activity = useMemo(() => bookingActivity(users), [users]);

  const joinedRecently = signups.reduce((sum, point) => sum + point.value, 0);
  const neverBooked = activity[0].value;

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard
        title="New users"
        takeaway={`${joinedRecently.toLocaleString()} joined in the last ${MONTHS_SHOWN} months`}
        emptyText={`No sign-ups in the last ${MONTHS_SHOWN} months`}
        data={signups}
      />
      <ChartCard
        title="Booking activity"
        takeaway={
          neverBooked > 0
            ? `${neverBooked.toLocaleString()} of ${users.length.toLocaleString()} users haven't booked yet`
            : "Every user has made at least one booking"
        }
        emptyText="No users yet"
        data={activity}
      />
    </section>
  );
}
