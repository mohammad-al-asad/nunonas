"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
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
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorGetLoyaltySettings, vendorUpdateLoyaltySettings } from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

interface LoyaltySettings {
  enable_loyalty_program?: boolean;
  points_rule_type?: string;
  points_earned?: number;
  currency_unit?: number;
  percentage_value?: number;
  first_booking_bonus?: number;
  review_bonus_points?: number;
  points_expiry_policy?: string;
  total_points_issued?: number;
  active_members?: number;
  repeat_booking_rate?: number;
  recent_activity?: LoyaltyActivity[];
}

interface LoyaltyActivity {
  type?: "booking" | "review" | string;
  customer_name?: string;
  reference?: string;
  points?: number;
  created_at?: string;
}

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enable_loyalty_program: false,
  points_rule_type: "points_per_currency",
  points_earned: 1,
  currency_unit: 1,
  percentage_value: 0,
  first_booking_bonus: 0,
  review_bonus_points: 0,
  points_expiry_policy: "1 Year",
};

export default function LoyaltyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<LoyaltySettings>({});
  const settingsQuery = useQuery({
    queryKey: vendorQueryKeys.loyalty,
    queryFn: ({ signal }) => vendorGetLoyaltySettings(signal),
  });
  const settings = {
    ...DEFAULT_LOYALTY_SETTINGS,
    ...(settingsQuery.data as LoyaltySettings | undefined),
    ...draft,
  };
  const setSettings = (updater: (current: LoyaltySettings) => LoyaltySettings) => {
    setDraft((currentDraft) => updater({
      ...DEFAULT_LOYALTY_SETTINGS,
      ...(settingsQuery.data as LoyaltySettings | undefined),
      ...currentDraft,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: vendorUpdateLoyaltySettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(vendorQueryKeys.loyalty, updated);
      setDraft({});
      toast("Loyalty settings saved.", "success");
    },
    onError: (error) => toast("Failed to save: " + (error instanceof Error ? error.message : String(error)), "error"),
  });

  const handleSave = async () => {
    if ((settings.currency_unit ?? 1) <= 0) {
      toast("Currency unit must be greater than zero.", "error");
      return;
    }
    await saveMutation.mutateAsync({
        enable_loyalty_program: settings.enable_loyalty_program ?? false,
        points_rule_type: settings.points_rule_type ?? "points_per_currency",
        points_earned: settings.points_earned ?? 1,
        currency_unit: settings.currency_unit ?? 1,
        percentage_value: settings.percentage_value ?? 0,
        first_booking_bonus: settings.first_booking_bonus ?? 0,
        review_bonus_points: settings.review_bonus_points ?? 0,
        points_expiry_policy: settings.points_expiry_policy ?? "1 Year",
      }).catch(() => undefined);
  };

  const statsItems = [
    {
      label: "TOTAL POINTS ISSUED",
      value: Number(settings.total_points_issued ?? 0).toLocaleString(),
      trend: "",
      icon: CircleDot,
      color: "text-[#1e2a5e]",
    },
    {
      label: "ACTIVE MEMBERS",
      value: Number(settings.active_members ?? 0).toLocaleString(),
      trend: "",
      icon: Users,
      color: "text-[#1e2a5e]",
    },
    {
      label: "REPEAT BOOKING RATE",
      value: `${Number(settings.repeat_booking_rate ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`,
      trend: "",
      icon: History,
      color: "text-[#1e2a5e]",
    },
  ];

  if (settingsQuery.isPending) {
    return (
      <div className="min-h-full bg-[#f8fafc] flex flex-col">
        <Header title="Loyalty Program" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <Header title="Loyalty Program" />
        <main className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-black text-slate-800">Loyalty settings could not be loaded</h1>
            <p className="mt-2 text-sm text-slate-500">No default settings were applied. Retry to safely manage your program.</p>
            <button type="button" onClick={() => void settingsQuery.refetch()} className="mt-5 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white">Try again</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Loyalty Program" />

      <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 bg-[#1e2a5e] hover:bg-[#1a2552] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-slate-900/10 transition-all disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : saveMutation.isSuccess ? "Saved!" : "Save Changes"}
            </button>
          </div>

          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex gap-6 items-center">
              <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  Enable Loyalty Program
                  <span className={cn(
                    "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider",
                    settings.enable_loyalty_program ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
                  )}>
                    {settings.enable_loyalty_program ? "Active" : "Inactive"}
                  </span>
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Allow customers to accumulate points on their bookings and reviews.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Enable or disable loyalty program"
              aria-pressed={Boolean(settings.enable_loyalty_program)}
              onClick={() => setSettings((s) => ({ ...s, enable_loyalty_program: !s.enable_loyalty_program }))}
              className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none",
                settings.enable_loyalty_program ? "bg-[#1e2a5e]" : "bg-slate-200",
              )}
            >
              <span className={cn(
                "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                settings.enable_loyalty_program ? "translate-x-7" : "translate-x-1",
              )} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Earning Rules */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3 mb-10">
                <Zap className="h-5 w-5 text-sky-500" />
                <h3 className="text-xl font-bold text-slate-800">Points Earning Rule</h3>
              </div>
              <div className="space-y-6">
                {/* Currency Rule */}
                <div
                  onClick={() => setSettings((s) => ({ ...s, points_rule_type: "points_per_currency" }))}
                  className={cn(
                    "p-8 rounded-[32px] border-2 transition-all cursor-pointer",
                    settings.points_rule_type === "points_per_currency"
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                      settings.points_rule_type === "points_per_currency" ? "border-sky-500 bg-sky-500" : "border-slate-300",
                    )}>
                      {settings.points_rule_type === "points_per_currency" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Points per Currency</h4>
                      <p className="text-sm text-slate-400 mt-1">Reward a fixed amount of points for every unit of currency spent.</p>
                      <div className="mt-6 flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">POINTS EARNED</label>
                          <input
                            type="number"
                            value={settings.points_earned ?? 5}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSettings((s) => ({ ...s, points_earned: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-400 mt-6">per</span>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CURRENCY ($)</label>
                          <input
                            type="number"
                            value={settings.currency_unit ?? 1}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSettings((s) => ({ ...s, currency_unit: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Percentage Rule */}
                <div
                  onClick={() => setSettings((s) => ({ ...s, points_rule_type: "percentage_based" }))}
                  className={cn(
                    "p-8 rounded-[32px] border-2 transition-all cursor-pointer",
                    settings.points_rule_type === "percentage_based"
                      ? "border-sky-500 bg-sky-50/20"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                      settings.points_rule_type === "percentage_based" ? "border-sky-500 bg-sky-500" : "border-slate-300",
                    )}>
                      {settings.points_rule_type === "percentage_based" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">Percentage-based</h4>
                      <p className="text-sm text-slate-400 mt-1">Earn points equal to a percentage of the total booking value.</p>
                      <div className="mt-6">
                        <div className="relative w-32">
                          <input
                            type="number"
                            value={settings.percentage_value ?? 10}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSettings((s) => ({ ...s, percentage_value: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus Rules */}
            <div className="lg:col-span-5 space-y-8 flex flex-col">
              <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 mb-10">
                  <Gift className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-xl font-bold text-slate-800">Bonus Rules</h3>
                </div>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">First Booking Bonus</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Points awarded when a customer completes their first appointment.</p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.first_booking_bonus ?? 100}
                        onChange={(e) => setSettings((s) => ({ ...s, first_booking_bonus: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-12 text-sm font-bold text-slate-700"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Review Bonus Points</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Points awarded for each verified review submitted by the customer.</p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.review_bonus_points ?? 25}
                        onChange={(e) => setSettings((s) => ({ ...s, review_bonus_points: Number(e.target.value) }))}
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
          <div className="flex flex-col items-center justify-between gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row">
            <div className="flex gap-6 items-center">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1e293b]">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-800">Points Expiry Policy</h3>
                <p className="text-sm text-slate-400 mt-1">Determine how long points remain valid before they are automatically removed.</p>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <select
                value={settings.points_expiry_policy ?? "1 Year"}
                onChange={(e) => setSettings((s) => ({ ...s, points_expiry_policy: e.target.value }))}
                className="appearance-none w-full bg-white border border-slate-100 rounded-xl py-3 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 cursor-pointer"
              >
                <option>1 Year</option>
                <option>2 Years</option>
                <option>No Expiry</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Analytics Overview */}
          <section className="pt-10 space-y-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <h2 className="text-2xl font-bold text-slate-800">Analytics Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {statsItems.map((stat, i) => (
                <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow group hover:shadow-md sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className={cn("h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-3xl font-black text-[#cca352] mt-2 tracking-tight">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <h3 className="text-lg font-bold text-slate-800">Recent points activity</h3>
                <p className="mt-1 text-sm text-slate-400">Points issued from completed bookings and verified reviews.</p>
              </div>
              {(settings.recent_activity ?? []).length ? (
                <div className="divide-y divide-slate-100">
                  {(settings.recent_activity ?? []).map((activity, index) => (
                    <div key={`${activity.reference ?? activity.type}-${index}`} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{activity.customer_name || "Customer"}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {activity.type === "review" ? "Review bonus" : "Completed booking"}
                          {activity.reference ? ` · ${activity.reference}` : ""}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm font-black text-emerald-600">+{Number(activity.points ?? 0).toLocaleString()} points</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {activity.created_at ? new Date(activity.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-8 py-10 text-center text-sm text-slate-400">
                  No points have been issued yet. Activity appears after a booking is completed or a verified review is submitted.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
