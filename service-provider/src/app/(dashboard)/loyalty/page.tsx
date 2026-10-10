"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { CircleDot, Clock3, History, Lock, Trophy, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorGetLoyalty, vendorSetLoyaltyEnrollment, type VendorLoyaltyOverview } from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function rulesSummary(rules: VendorLoyaltyOverview["rules"]) {
  const earning = rules.points_rule_type === "percentage_based"
    ? `${rules.percentage_value}% of the booking amount in points`
    : `${rules.points_earned} point${rules.points_earned === 1 ? "" : "s"} for every ${rules.currency_unit} spent`;
  return [
    { label: "Points earned", value: earning },
    { label: "First booking bonus", value: rules.first_booking_bonus ? `${rules.first_booking_bonus} points` : "None" },
    { label: "Review bonus", value: rules.review_bonus_points ? `${rules.review_bonus_points} points` : "None" },
    { label: "Points expire", value: rules.points_expiry_policy === "No Expiry" ? "Never" : `After ${rules.points_expiry_policy.toLowerCase()}` },
  ];
}

export default function LoyaltyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmOff, setConfirmOff] = useState(false);
  // Captured once per visit; the 30-day lock changes on a scale of days.
  const [now] = useState(() => Date.now());
  const loyaltyQuery = useQuery({
    queryKey: vendorQueryKeys.loyalty,
    queryFn: ({ signal }) => vendorGetLoyalty(signal),
  });

  const enrollment = useMutation({
    mutationFn: vendorSetLoyaltyEnrollment,
    onSuccess: (updated, enabled) => {
      queryClient.setQueryData(vendorQueryKeys.loyalty, updated);
      setConfirmOff(false);
      toast(enabled ? "Request sent. The admin will review it shortly." : "Loyalty program turned off.", "success");
    },
    onError: (error) => toast(error instanceof Error ? error.message : "Something went wrong.", "error"),
  });

  if (loyaltyQuery.isPending) {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <Header title="Loyalty Program" />
        <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-8" aria-busy="true">
          <div className="h-32 animate-pulse rounded-3xl bg-white" />
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2].map((index) => <div key={index} className="h-36 animate-pulse rounded-3xl bg-white" />)}
          </div>
        </main>
      </div>
    );
  }

  if (loyaltyQuery.isError || !loyaltyQuery.data) {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <Header title="Loyalty Program" />
        <main className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-black text-slate-800">The loyalty program could not be loaded</h1>
            <button type="button" onClick={() => void loyaltyQuery.refetch()} className="mt-5 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white">Try again</button>
          </div>
        </main>
      </div>
    );
  }

  const data = loyaltyQuery.data;
  const { program } = data;
  const lockedUntil = program.can_turn_off_at ? new Date(program.can_turn_off_at) : null;
  const locked = program.status === "active" && Boolean(lockedUntil && lockedUntil.getTime() > now);

  const statusCopy = {
    off: { badge: "Off", tone: "bg-slate-100 text-slate-600", text: "Turn the program on to reward your customers with points. The admin reviews each request before it goes live." },
    pending: { badge: "Waiting for approval", tone: "bg-amber-50 text-amber-700", text: `Requested on ${formatDate(program.requested_at)}. You'll get a notification when the admin reviews it.` },
    active: { badge: "Active", tone: "bg-emerald-50 text-emerald-700", text: `Active since ${formatDate(program.approved_at)}. Customers earn points on completed bookings and reviews.` },
    rejected: { badge: "Declined", tone: "bg-rose-50 text-rose-700", text: program.rejection_reason ? `The admin declined your request: ${program.rejection_reason}` : "The admin declined your request. You can send a new one." },
  }[program.status];

  const stats = [
    { label: "Total points issued", value: Number(data.total_points_issued ?? 0).toLocaleString(), icon: CircleDot },
    { label: "Active members", value: Number(data.active_members ?? 0).toLocaleString(), icon: Users },
    { label: "Repeat booking rate", value: `${Number(data.repeat_booking_rate ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`, icon: History },
  ];

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc] pb-10">
      <Header title="Loyalty Program" />

      <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Program status and on/off */}
        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-100/50 bg-amber-50 text-amber-500">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Loyalty program</h2>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusCopy.tone)}>{statusCopy.badge}</span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{statusCopy.text}</p>
              {locked ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  The program must stay on for at least {program.min_active_days} days. You can turn it off from {formatDate(program.can_turn_off_at)}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            {program.status === "off" || program.status === "rejected" ? (
              <button
                type="button"
                disabled={enrollment.isPending}
                onClick={() => enrollment.mutate(true)}
                className="rounded-xl bg-[#1e2a5e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:opacity-60"
              >
                {program.status === "rejected" ? "Request again" : "Turn on"}
              </button>
            ) : program.status === "pending" ? (
              <button
                type="button"
                disabled={enrollment.isPending}
                onClick={() => enrollment.mutate(false)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <Clock3 className="h-4 w-4" />
                Cancel request
              </button>
            ) : (
              <button
                type="button"
                disabled={enrollment.isPending || locked}
                onClick={() => setConfirmOff(true)}
                title={locked ? `Available from ${formatDate(program.can_turn_off_at)}` : undefined}
                className="rounded-xl border border-rose-200 px-6 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                Turn off
              </button>
            )}
          </div>
        </section>

        {/* Platform rules, read-only */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-800">How customers earn points</h2>
          <p className="mt-1 text-sm text-slate-500">These rules are set by the platform and are the same for every provider.</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rulesSummary(data.rules).map((rule) => (
              <div key={rule.label} className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rule.label}</dt>
                <dd className="mt-1 text-sm font-bold text-slate-700">{rule.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Analytics */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <h2 className="text-2xl font-bold text-slate-800">Analytics Overview</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[#1e2a5e]">
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[#cca352]">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <h3 className="text-lg font-bold text-slate-800">Recent points activity</h3>
              <p className="mt-1 text-sm text-slate-400">Points issued from completed bookings and verified reviews.</p>
            </div>
            {data.recent_activity.length ? (
              <div className="divide-y divide-slate-100">
                {data.recent_activity.map((activity, index) => (
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
                      <p className="mt-1 text-xs text-slate-400">{activity.created_at ? new Date(activity.created_at).toLocaleString() : ""}</p>
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
      </main>

      <ConfirmDialog
        open={confirmOff}
        title="Turn off the loyalty program?"
        message="Customers will stop earning points at your business. To turn it on again, the admin has to approve a new request."
        confirmLabel="Turn off"
        destructive
        busy={enrollment.isPending}
        onClose={() => setConfirmOff(false)}
        onConfirm={() => enrollment.mutate(false)}
      />
    </div>
  );
}
