"use client";

import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  onClose: () => void;
  selectedRange: { start: Date | null; end: Date | null };
  onRangeChange: (range: { start: Date | null; end: Date | null }) => void;
}

export function DatePicker({
  onClose,
  selectedRange,
  onRangeChange,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateClick = (day: Date) => {
    const clickedDate = startOfDay(day);

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      onRangeChange({ start: clickedDate, end: null });
    } else if (clickedDate < selectedRange.start) {
      onRangeChange({ start: clickedDate, end: null });
    } else if (isSameDay(clickedDate, selectedRange.start)) {
      onRangeChange({ start: null, end: null });
    } else {
      onRangeChange({ start: selectedRange.start, end: clickedDate });
    }
  };

  const isSelected = (day: Date) => {
    if (selectedRange.start && isSameDay(day, selectedRange.start)) return true;
    if (selectedRange.end && isSameDay(day, selectedRange.end)) return true;
    return false;
  };

  const isInRange = (day: Date) => {
    if (selectedRange.start && selectedRange.end) {
      return isWithinInterval(day, {
        start: selectedRange.start,
        end: selectedRange.end,
      });
    }
    return false;
  };

  return (
    <div className="absolute top-full mt-4 right-0 z-50 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-2xl w-[320px] animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800">Select Range</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        </button>
        <span className="text-sm font-bold text-slate-700">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-[10px] font-bold text-slate-300 text-center py-2 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const selected = isSelected(day);
          const inRange = isInRange(day);

          return (
            <button
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-9 w-9 text-xs rounded-xl flex items-center justify-center transition-all relative",
                !isSameMonth(day, currentMonth) && "text-slate-200",
                selected
                  ? "bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/20 z-10"
                  : "hover:bg-slate-50 text-slate-600",
                inRange && !selected && "bg-sky-50 text-sky-600 font-medium",
              )}
            >
              {format(day, "d")}
              {inRange && !selected && (
                <div className="absolute inset-0 bg-sky-100/30 -z-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onRangeChange({ start: null, end: null })}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
