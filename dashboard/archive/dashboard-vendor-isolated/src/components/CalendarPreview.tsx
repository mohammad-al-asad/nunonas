"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";

export function CalendarPreview() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = ["S", "M", "T", "W", "T", "F", "S"];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-bold text-slate-800">Calendar Preview</h3>
        <div className="flex items-center space-x-2">
          <ChevronLeft
            className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
            onClick={prevMonth}
          />
          <span className="text-xs font-bold uppercase text-slate-500 min-w-[80px] text-center">
            {format(currentMonth, "MMM yyyy")}
          </span>
          <ChevronRight
            className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
            onClick={nextMonth}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {days.map((d, i) => (
          <div
            key={i}
            className="text-[10px] font-semibold text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-all",
                !isCurrentMonth && "text-slate-200",
                isCurrentMonth &&
                  !isSelected &&
                  !isTodayDate &&
                  "text-slate-600 hover:bg-slate-50",
                isTodayDate && !isSelected && "bg-sky-50 text-sky-500",
                isSelected && "bg-[#38bdf8] text-white",
              )}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
