"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  MousePointer2,
  Plus,
  Tag,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { PromotionsTable, PromotionsTableSkeleton, Promotion } from "@/components/PromotionsTable";
import { PlatformOffers } from "@/components/PlatformOffers";
import {
  vendorListPromotions,
  vendorRespondToPlatformOffer,
  vendorUpdatePromotionStatus,
  type VendorPlatformOffer,
} from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

type PromotionSummary = {
  totalPromotions: number;
  activePromotions: number;
  campaignReach: number;
  averageConversionPercent: number | null;
  totalPromoRevenue: string | null;
};

type PromotionsResponse = {
  items?: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  business_promotions?: Record<string, unknown>[];
  platform_offers?: VendorPlatformOffer[];
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number | null): string {
  return value === null ? "--" : `${value}%`;
}

function formatMoney(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return null;
}

const EMPTY_SUMMARY: PromotionSummary = {
  totalPromotions: 0,
  activePromotions: 0,
  campaignReach: 0,
  averageConversionPercent: null,
  totalPromoRevenue: null,
};

export default function PromotionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const promotionsKey = vendorQueryKeys.promotions();
  const promotionsQuery = useQuery({
    queryKey: promotionsKey,
    queryFn: ({ signal }) => vendorListPromotions({}, signal) as Promise<PromotionsResponse>,
  });
  const raw = promotionsQuery.data;
  const items = raw?.business_promotions ?? raw?.items ?? [];
  const businessPromotions: Promotion[] = items.map((promotion) => ({
    id: String(promotion.id ?? promotion._id ?? ""),
    name: String(promotion.name ?? promotion.title ?? ""),
    description: String(promotion.description ?? ""),
    type: String(promotion.type ?? "PERCENTAGE"),
    value: String(promotion.value ?? ""),
    schedule: String(promotion.schedule ?? ""),
    usageCount: toNumber(promotion.usage_count ?? promotion.usageCount),
    usageMax: toNumber(promotion.usage_max ?? promotion.usageMax),
    isActive: Boolean(promotion.is_active ?? promotion.isActive ?? promotion.active),
    isCurrentlyAvailable: Boolean(promotion.is_currently_available ?? promotion.isCurrentlyAvailable),
  }));
  const rawSummary = raw?.summary ?? {};
  const summary: PromotionSummary = raw ? {
    totalPromotions: toNumber(rawSummary.total_promotions),
    activePromotions: toNumber(rawSummary.active_promotions),
    campaignReach: toNumber(rawSummary.campaign_reach),
    averageConversionPercent: rawSummary.avg_conversion_percent == null ? null : toNumber(rawSummary.avg_conversion_percent),
    totalPromoRevenue: formatMoney(rawSummary.total_promo_revenue ?? rawSummary.promo_revenue),
  } : EMPTY_SUMMARY;

  const platformOffers = raw?.platform_offers ?? [];
  const respondMutation = useMutation({
    mutationFn: ({ offer, accept }: { offer: VendorPlatformOffer; accept: boolean }) =>
      vendorRespondToPlatformOffer(offer.id, accept),
    onSuccess: (updated, { accept }) => {
      queryClient.setQueryData<PromotionsResponse>(promotionsKey, (current) =>
        current
          ? { ...current, platform_offers: current.platform_offers?.map((offer) => (offer.id === updated.id ? updated : offer)) }
          : current,
      );
      toast(accept ? "Offer accepted. It will apply during the offer period." : "Offer rejected.", "success");
    },
    onError: (error) => toast(error instanceof Error ? error.message : "Could not save your answer.", "error"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: promotionsKey }),
  });
  const promotionMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => vendorUpdatePromotionStatus(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: promotionsKey });
      const previous = queryClient.getQueryData<PromotionsResponse>(promotionsKey);
      queryClient.setQueryData<PromotionsResponse>(promotionsKey, (current) => {
        if (!current) return current;
        const update = (promotion: Record<string, unknown>) => String(promotion.id ?? promotion._id) === id ? { ...promotion, active, is_active: active, isActive: active } : promotion;
        return { ...current, items: current.items?.map(update), business_promotions: current.business_promotions?.map(update) };
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(promotionsKey, context?.previous);
      toast(error instanceof Error ? error.message : "Failed to update promotion.", "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: promotionsKey }),
  });

  const togglePromotionStatus = (promotion: Promotion) => promotionMutation.mutate({ id: promotion.id, active: !promotion.isActive });
  const stats = [
    {
      label: "TOTAL PROMO REVENUE",
      value: summary.totalPromoRevenue ?? "--",
      icon: TrendingUp,
    },
    {
      label: "ACTIVE PROMOTIONS",
      value: `${summary.activePromotions}`,
      subtext: `${summary.totalPromotions} total promotions`,
      icon: Tag,
    },
    {
      label: "CAMPAIGN REACH",
      value: formatCompactNumber(summary.campaignReach),
      icon: Users,
    },
    {
      label: "AVG. CONVERSION",
      value: formatPercent(summary.averageConversionPercent),
      icon: MousePointer2,
    },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Promotions" />

      <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="flex justify-end">
            <Link
              href="/promotions/new"
              className="flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-[#1a2552]"
            >
              <Plus className="h-4 w-4" />
              Add Promotion
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow group hover:shadow-md"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </span>
                  </div>
                  {stat.subtext && (
                    <p className="text-[10px] font-medium text-slate-400 mt-1">
                      {stat.subtext}
                    </p>
                  )}
                </div>
                <div className="absolute top-6 right-6 h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>

          {promotionsQuery.isSuccess ? (
            <PlatformOffers
              offers={platformOffers}
              busyId={respondMutation.isPending ? respondMutation.variables?.offer.id ?? null : null}
              onRespond={(offer, accept) => respondMutation.mutate({ offer, accept })}
            />
          ) : null}

          {/* Business Promotions Table */}
          {promotionsQuery.isPending ? (
            <PromotionsTableSkeleton />
          ) : promotionsQuery.isError ? (
            <div className="rounded-[32px] border border-red-100 bg-white p-10 text-center text-sm text-red-600">Promotions could not be loaded. <button type="button" onClick={() => promotionsQuery.refetch()} className="font-bold underline">Try again</button></div>
          ) : (
            <PromotionsTable promotions={businessPromotions} onToggleStatus={togglePromotionStatus} />
          )}

        </div>
      </main>
    </div>
  );
}
