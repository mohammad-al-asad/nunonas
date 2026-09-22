"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import {
  Info,
  Percent,
  Wallet,
  GlassWater,
  Sparkles,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OfferType = "percentage" | "fixed" | "happy_hour" | "custom";

export default function AddPromotionPage() {
  const [selectedOffer, setSelectedOffer] = useState<OfferType>("percentage");
  const [recurringDays, setRecurringDays] = useState<string[]>([
    "M",
    "T",
    "W",
    "T",
    "F",
  ]);
  const [requirePromoCode, setRequirePromoCode] = useState(true);
  const [firstTimeOnly, setFirstTimeOnly] = useState(false);

  const toggleDay = (day: string, idx: number) => {
    // Handling duplicate day letters (T, T, S, S) by using index or a better key
    // For simplicity in UI display, we'll just toggle based on a combined key or just accept simple toggle
    setRecurringDays((prev) =>
      prev.includes(`${day}-${idx}`)
        ? prev.filter((d) => d !== `${day}-${idx}`)
        : [...prev, `${day}-${idx}`],
    );
  };

  const days = ["M", "T", "W", "T", "F", "S", "S"];

  const renderOfferCard = (
    id: OfferType,
    icon: React.ElementType,
    label: string,
  ) => (
    <div
      onClick={() => setSelectedOffer(id)}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer group",
        selectedOffer === id
          ? "border-sky-500 bg-sky-50/30"
          : "border-slate-100 bg-white hover:border-slate-200",
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
          selectedOffer === id
            ? "text-sky-500"
            : "text-slate-400 group-hover:text-slate-600",
        )}
      >
        {React.createElement(icon, { className: "h-5 w-5" })}
      </div>
      <span
        className={cn(
          "text-xs font-bold",
          selectedOffer === id ? "text-sky-600" : "text-slate-500",
        )}
      >
        {label}
      </span>
      {selectedOffer === id && (
        <div className="absolute top-2 right-2 h-4 w-4 bg-sky-500 rounded-full flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-white rounded-full" />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-32">
      <Header title="Promotions" />

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-[800px] mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Add New Promotion
          </h1>

          {/* Basic Information */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-6 w-6 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                <Info className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Basic Information
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Promotion Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Wellness 2026"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Internal Description
                </label>
                <textarea
                  placeholder="Brief explanation of this promotion for staff..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Discount Details */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-8">
              Discount Details
            </h2>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Offer Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {renderOfferCard("percentage", Percent, "Percentage")}
                  {renderOfferCard("fixed", Wallet, "Fixed Amount")}
                  {renderOfferCard("happy_hour", GlassWater, "Happy Hour")}
                  {renderOfferCard("custom", Sparkles, "Custom Deal")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Discount Value (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Applicable To
                  </label>
                  <div className="relative">
                    <select className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer font-medium text-slate-600">
                      <option>All Services</option>
                      <option>Spa Only</option>
                      <option>Dining Only</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validity & Schedule */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-6 w-6 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Validity & Schedule
              </h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recurring Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day, idx) => {
                    const id = `${day}-${idx}`;
                    const isSelected =
                      recurringDays.includes(id) ||
                      (idx < 5 && recurringDays.includes(day)); // Rough match for initial state
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(day, idx)}
                        className={cn(
                          "flex-1 min-w-[48px] py-3 rounded-xl text-xs font-bold border-2 transition-all",
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200",
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Usage & Conditions */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-8">
              Usage & Conditions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Require Promo Code
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Customer must enter a code to redeem
                    </p>
                  </div>
                  <button
                    onClick={() => setRequirePromoCode(!requirePromoCode)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      requirePromoCode ? "bg-sky-500" : "bg-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        requirePromoCode ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
                {requirePromoCode && (
                  <input
                    type="text"
                    defaultValue="SUMMER20"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      First-time customers only
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Limit to new guest registrations
                    </p>
                  </div>
                  <button
                    onClick={() => setFirstTimeOnly(!firstTimeOnly)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      firstTimeOnly ? "bg-sky-500" : "bg-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        firstTimeOnly ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Minimum Spend ($)
                  </label>
                  <input
                    type="number"
                    placeholder="50.00"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 z-50 transition-all">
        <div className="max-w-[800px] mx-auto flex items-center justify-end gap-4 px-4 sm:px-0">
          <Link
            href="/promotions"
            className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-100"
          >
            Cancel
          </Link>
          <button className="px-8 py-3.5 bg-[#1e2a5e] hover:bg-[#1a2552] text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all">
            Create Promotion
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
