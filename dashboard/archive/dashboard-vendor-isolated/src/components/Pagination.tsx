"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3">
      <p className="text-sm text-slate-400 font-medium">
        Showing{" "}
        <span className="text-slate-700">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="text-slate-700">{totalItems}</span> bookings
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {(() => {
            const pagesToShow = 3;
            let startPage = Math.max(1, currentPage - 1);
            if (startPage + pagesToShow - 1 > totalPages) {
              startPage = Math.max(1, totalPages - pagesToShow + 1);
            }
            const pages = Array.from(
              { length: Math.min(pagesToShow, totalPages) },
              (_, i) => startPage + i,
            );

            return pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-xl font-bold text-sm transition-all",
                  currentPage === page
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "bg-white border border-transparent text-slate-500 hover:bg-slate-50",
                )}
              >
                {page}
              </button>
            ));
          })()}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
