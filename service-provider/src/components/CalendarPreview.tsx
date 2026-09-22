"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { calendarPreviewQuery } from "@/lib/vendor-queries";

export type CalendarPreviewPayload = { month?: string; busy_days?: Array<{ day?: number; count?: number }> };

export function CalendarPreview({ initialData }: { initialData?: CalendarPreviewPayload }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parsed = initialData?.month ? new Date(`${initialData.month}-01T00:00:00`) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const visibleMonthKey = useMemo(() => format(currentMonth, "yyyy-MM"), [currentMonth]);
  const needsRemoteMonth = visibleMonthKey !== initialData?.month;
  const monthQuery = useQuery({ ...calendarPreviewQuery(visibleMonthKey), enabled: needsRemoteMonth });
  const payload = needsRemoteMonth ? monthQuery.data as CalendarPreviewPayload | undefined : initialData;
  const busyDays = Object.fromEntries((payload?.busy_days ?? []).filter((entry) => typeof entry.day === "number").map((entry) => [Number(entry.day), Number(entry.count ?? 0)]));
  const monthStart = startOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

  return (
    <section aria-labelledby="calendar-preview-title" className="h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-8 flex items-center justify-between">
        <h3 id="calendar-preview-title" className="text-sm font-bold text-slate-800">Calendar Preview</h3>
        <div className="flex items-center space-x-1">
          <button type="button" aria-label="Previous month" onClick={() => setCurrentMonth((month) => subMonths(month, 1))} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[80px] text-center text-xs font-bold uppercase text-slate-500">{format(currentMonth, "MMM yyyy")}</span>
          <button type="button" aria-label="Next month" onClick={() => setCurrentMonth((month) => addMonths(month, 1))} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      {monthQuery.isPending && needsRemoteMonth ? (
        <div className="flex h-[220px] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div>
      ) : monthQuery.isError && needsRemoteMonth ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-sm text-red-600"><span>Calendar could not be loaded.</span><button type="button" onClick={() => monthQuery.refetch()} className="rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-700">Try again</button></div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-7 gap-1 text-center">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <div key={`${day}-${index}`} className="py-1 text-[10px] font-semibold text-slate-400">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const today = isToday(day);
              const busyCount = isCurrentMonth ? busyDays[Number(format(day, "d"))] ?? 0 : 0;
              return (
                <button type="button" aria-label={`${format(day, "MMMM d, yyyy")}${busyCount ? `, ${busyCount} bookings` : ""}`} key={day.toISOString()} onClick={() => setSelectedDate(day)} className={cn("relative flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-all", !isCurrentMonth && "text-slate-200", isCurrentMonth && !isSelected && !today && "text-slate-600 hover:bg-slate-50", today && !isSelected && "bg-sky-50 text-sky-500", isSelected && "bg-[#38bdf8] text-white")}>
                  {format(day, "d")}{isCurrentMonth && busyCount > 0 && !isSelected ? <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-sky-500" /> : null}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
