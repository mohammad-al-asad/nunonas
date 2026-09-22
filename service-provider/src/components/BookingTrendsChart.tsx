"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TrendPoint {
  name?: string;
  period?: string;
  month?: string;
  value?: number;
  count?: number;
  bookings?: number;
}

export function BookingTrendsChart({ trends = [] }: { trends?: TrendPoint[] }) {
  const data = trends.map((point) => ({
    period: point.period ?? point.name ?? point.month ?? "",
    name: point.name ?? point.month ?? point.period ?? "",
    value: Number(point.value ?? point.count ?? point.bookings ?? 0),
  }));
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <section aria-labelledby="booking-trends-title" className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-8 flex items-center justify-between"><h3 id="booking-trends-title" className="text-lg font-bold text-slate-800">Booking Trends</h3></div>
      <div className="h-[300px] min-h-[300px] w-full flex-none">
        {data.length === 0 ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">No trend data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, Math.ceil(maxValue * 1.2)]} />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Bar dataKey="value" name="Bookings" fill="#1e2a5e" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
