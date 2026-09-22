"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  Trophy,
  Zap,
  Gift,
  Users,
  History,
  CircleDot,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Save,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOYALTY_STATS = [
  {
    label: "TOTAL POINTS ISSUED",
    value: "1,284,500",
    trend: "+12%",
    icon: CircleDot,
    color: "text-[#1e2a5e]",
  },
  {
    label: "ACTIVE MEMBERS",
    value: "12,482",
    trend: "+8.4%",
    icon: Users,
    color: "text-[#1e2a5e]",
  },
  {
    label: "REPEAT BOOKING RATE",
    value: "64.8%",
    trend: "+15.2%",
    icon: History,
    color: "text-[#1e2a5e]",
  },
];

export default function LoyaltyPage() {
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState(true);
  const [earningType, setEarningType] = useState<"currency" | "percentage">(
    "currency",
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Loyalty Program" />

      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Loyalty Points Settings
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Configure how your customers earn and spend rewards
              </p>
            </div>
            <button className="flex items-center gap-2 bg-[#1e2a5e] hover:bg-[#1a2552] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-slate-900/10 transition-all">
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>

          {/* Master Enable Toggle */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex gap-6 items-center">
              <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  Enable Loyalty Program
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg uppercase tracking-wider">
                    Active
                  </span>
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Allow customers to accumulate points on their bookings and
                  reviews.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsLoyaltyEnabled(!isLoyaltyEnabled)}
              className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none",
                isLoyaltyEnabled ? "bg-[#1e2a5e]" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                  isLoyaltyEnabled ? "translate-x-7" : "translate-x-1",
                )}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Earning Rules */}
            <div className="lg:col-span-7 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-10">
                <Zap className="h-5 w-5 text-sky-500" />
                <h3 className="text-xl font-bold text-slate-800">
                  Points Earning Rule
                </h3>
              </div>

              <div className="space-y-6">
                {/* Rule 1 */}
                <div
                  onClick={() => setEarningType("currency")}
                  className={cn(
                    "p-8 rounded-[32px] border-2 transition-all cursor-pointer group",
                    earningType === "currency"
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                        earningType === "currency"
                          ? "border-sky-500 bg-sky-500"
                          : "border-slate-300",
                      )}
                    >
                      {earningType === "currency" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">
                        Points per Currency
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">
                        Reward a fixed amount of points for every unit of
                        currency spent.
                      </p>

                      <div className="mt-6 flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                            POINTS EARNED
                          </label>
                          <input
                            type="number"
                            defaultValue="5"
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-400 mt-6">
                          per
                        </span>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            CURRENCY ($)
                          </label>
                          <input
                            type="number"
                            defaultValue="1"
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rule 2 */}
                <div
                  onClick={() => setEarningType("percentage")}
                  className={cn(
                    "p-8 rounded-[32px] border-2 transition-all cursor-pointer group",
                    earningType === "percentage"
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                        earningType === "percentage"
                          ? "border-sky-500 bg-sky-500"
                          : "border-slate-300",
                      )}
                    >
                      {earningType === "percentage" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">
                        Percentage-based
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">
                        Earn points equal to a percentage of the total booking
                        value.
                      </p>

                      <div className="mt-6">
                        <div className="relative w-32">
                          <input
                            type="number"
                            defaultValue="10"
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus Rules */}
            <div className="lg:col-span-5 space-y-8 flex flex-col">
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex-1">
                <div className="flex items-center gap-3 mb-10">
                  <Gift className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-xl font-bold text-slate-800">
                    Bonus Rules
                  </h3>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        First Booking Bonus
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Points awarded when a customer completes their first
                        appointment.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        defaultValue="100"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-12 text-sm font-bold text-slate-700"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Review Bonus Points
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Points awarded for each verified review submitted by the
                        customer.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        defaultValue="25"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-12 text-sm font-bold text-slate-700"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
                        <RotateCcw className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Policy */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex gap-6 items-center">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1e293b]">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-800">
                  Points Expiry Policy
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Determine how long points remain valid before they are
                  automatically removed from user accounts.
                </p>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <select className="appearance-none w-full bg-white border border-slate-100 rounded-xl py-3 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 cursor-pointer">
                <option>1 Year</option>
                <option>2 Years</option>
                <option>No Expiry</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Analytics Overview Section */}
          <section className="pt-10 space-y-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <h2 className="text-2xl font-bold text-slate-800">
                Analytics Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {LOYALTY_STATS.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div
                      className={cn(
                        "h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center",
                        stat.color,
                      )}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 group-hover:scale-110 transition-transform origin-right">
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {stat.label}
                    </p>
                    <h3 className="text-3xl font-black text-[#cca352] mt-2 tracking-tight">
                      {stat.value}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
