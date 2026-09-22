import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "./DatePicker";

interface BookingsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
}

export function BookingsHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: BookingsHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const rangeText =
    dateRange.start && dateRange.end
      ? `${format(dateRange.start, "MMM dd")} - ${format(dateRange.end, "MMM dd")}`
      : dateRange.start
        ? `${format(dateRange.start, "MMM dd")} - Select End`
        : "Select Date Range";

  return (
    <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-100 mb-8 transition-all">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Bookings
          </h2>
          <p className="text-sm text-slate-400 max-w-sm">
            Manage and monitor all your table reservations in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
          {/* Search */}
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or ID"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 sm:py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="relative group w-full sm:w-auto min-w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 sm:py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer font-medium"
            >
              <option value="All">Status: All Bookings</option>
              <option value="Confirmed">Status: Confirmed</option>
              <option value="Pending">Status: Pending</option>
              <option value="Cancelled">Status: Cancelled</option>
              <option value="Complete">Status: Complete</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Picker */}
          <div className="relative w-full sm:w-auto" ref={calendarRef}>
            <div
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl py-3.5 sm:py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600 font-medium truncate min-w-[120px]">
                {rangeText}
              </span>
            </div>

            {isCalendarOpen && (
              <DatePicker
                onClose={() => setIsCalendarOpen(false)}
                selectedRange={dateRange}
                onRangeChange={onDateRangeChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
