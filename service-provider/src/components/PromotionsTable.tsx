import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "HAPPY HOUR" | "FIXED" | string;
  value: string;
  schedule: string;
  usageCount: number;
  usageMax: number;
  isActive: boolean;
  isCurrentlyAvailable: boolean;
}

interface PromotionsTableProps {
  promotions: Promotion[];
  onToggleStatus: (promotion: Promotion) => void;
}

export function PromotionsTable({ promotions, onToggleStatus }: PromotionsTableProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filtered = useMemo(() => promotions.filter((promotion) => {
    const matchesSearch = `${promotion.name} ${promotion.description}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (type === "ALL" || promotion.type === type);
  }), [promotions, search, type]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visiblePromotions = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header with Filters */}
      <div className="flex flex-col justify-between gap-5 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Business Promotions
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group w-full sm:min-w-[260px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search promotions..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <div className="relative group min-w-[140px]">
            <select aria-label="Filter promotions by type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer font-medium text-slate-600">
              <option value="ALL">All Types</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="HAPPY HOUR">Happy Hour</option>
              <option value="FIXED">Fixed</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Promo Name
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Type
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Value
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Schedule
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Usage Stats
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visiblePromotions.map((promo) => {
              const usagePercent = Math.round(
                promo.usageMax > 0 ? (promo.usageCount / promo.usageMax) * 100 : 0,
              );
              const typeStyles = {
                PERCENTAGE: "bg-blue-50 text-blue-600 border-blue-100/50",
                "HAPPY HOUR":
                  "bg-purple-50 text-purple-600 border-purple-100/50",
                FIXED: "bg-amber-50 text-amber-600 border-amber-100/50",
              }[promo.type];

              return (
                <tr
                  key={promo.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div>
                      <Link href={`/promotions/${encodeURIComponent(promo.id)}`} className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                        {promo.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {promo.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                        typeStyles,
                      )}
                    >
                      {promo.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-700">
                      {promo.value}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      {promo.schedule.includes("Sun") ? (
                        <svg
                          className="h-3.5 w-3.5 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      ) : (
                        <svg
                          className="h-3.5 w-3.5 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                      {promo.schedule}
                    </span>
                  </td>
                  <td className="px-8 py-6 min-w-[180px]">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-700">
                          {promo.usageCount} {promo.usageCount === 1 ? "redemption" : "redemptions"}
                        </span>
                        {promo.usageMax > 0 ? <span className="text-slate-400">{usagePercent}%</span> : null}
                      </div>
                      {promo.usageMax > 0 ? <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            usagePercent > 80 ? "bg-amber-500" : "bg-sky-500",
                          )}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div> : null}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="inline-flex flex-col items-end gap-2">
                      <span className={cn("text-[9px] font-black uppercase tracking-wider", promo.isCurrentlyAvailable ? "text-emerald-600" : "text-slate-400")}>
                        {promo.isCurrentlyAvailable ? "Available" : promo.isActive ? "Out of schedule" : "Inactive"}
                      </span>
                      <button
                        onClick={() => onToggleStatus(promo)}
                        aria-label={`Toggle ${promo.name}`}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          promo.isActive
                            ? "bg-sky-500 shadow-lg shadow-sky-500/20"
                            : "bg-slate-200",
                        )}
                      >
                        <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          promo.isActive ? "translate-x-6" : "translate-x-1",
                        )}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visiblePromotions.length === 0 ? <tr><td colSpan={6} className="px-8 py-12 text-center text-sm font-medium text-slate-400">No promotions match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination Placeholder */}
      <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
        <p className="text-[11px] font-medium text-slate-400 ml-4">
          Showing{" "}
          <span className="text-slate-700 font-bold">{visiblePromotions.length}</span>{" "}
          of {filtered.length} matching promotions
        </p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => current - 1)} className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
          <span className="text-[11px] font-bold text-slate-500">Page {safePage} of {pageCount}</span>
          <button type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => current + 1)} className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
