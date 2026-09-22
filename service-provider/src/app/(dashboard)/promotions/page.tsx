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
import { PromotionsTable, Promotion } from "@/components/PromotionsTable";
import { CampaignCard } from "@/components/CampaignCard";
import {
  vendorListPromotions,
  vendorJoinPlatformCampaign,
  vendorUpdatePromotionStatus,
} from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

type PromotionSummary = {
  totalPromotions: number;
  activePromotions: number;
  campaignReach: number;
  averageConversionPercent: number | null;
  totalPromoRevenue: string | null;
};

type PlatformCampaign = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  requirementValue: string;
  duration: string;
  durationValue: string;
  boostType: "visibility" | "acquisition" | "premium";
  boostText: string;
  boostSubtext: string;
  commission: string;
  isActive: boolean;
};

type PromotionsResponse = {
  items?: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  business_promotions?: Record<string, unknown>[];
  platform_campaigns?: Record<string, unknown>[];
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

function normalizeBoostType(value: unknown): PlatformCampaign["boostType"] {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "acquisition" || normalized === "premium") {
      return normalized;
    }
  }
  return "visibility";
}

function normalizePlatformCampaign(
  campaign: Record<string, unknown>,
): PlatformCampaign {
  const requirementValue =
    (campaign.requirement_value ??
      campaign.requirementValue ??
      campaign.min_discount ??
      campaign.discount ??
      campaign.offer_value) as string | number | undefined;
  const durationValue =
    (campaign.duration_value ??
      campaign.durationValue ??
      campaign.duration ??
      campaign.validity ??
      campaign.date_range) as string | undefined;
  const commissionPercent = campaign.commission_percent ?? campaign.commission;

  return {
    id: String(campaign.id ?? campaign._id ?? ""),
    title: String(campaign.campaign_name ?? campaign.title ?? campaign.name ?? "Campaign"),
    description: String(campaign.description ?? ""),
    requirement: "Requirement",
    requirementValue:
      requirementValue !== undefined && requirementValue !== null && `${requirementValue}`.trim()
        ? `${requirementValue}`
        : "--",
    duration: "Duration",
    durationValue: durationValue && durationValue.trim() ? durationValue : "--",
    boostType: normalizeBoostType(campaign.boost_type ?? campaign.type),
    boostText: String(campaign.boost_text ?? campaign.boost_label ?? "PLATFORM BOOST"),
    boostSubtext: String(campaign.boost_subtext ?? campaign.boost_description ?? "Live campaign visibility from the platform."),
    commission:
      commissionPercent !== undefined && commissionPercent !== null && `${commissionPercent}`.trim()
        ? `${commissionPercent}${typeof commissionPercent === "number" ? "%" : ""}`
        : "--",
    isActive: Boolean(campaign.joined ?? campaign.is_active ?? campaign.active),
  };
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
  const platformCampaigns = (raw?.platform_campaigns ?? []).map(normalizePlatformCampaign);

  const campaignMutation = useMutation({
    mutationFn: ({ id, joined }: { id: string; joined: boolean }) => vendorJoinPlatformCampaign(id, joined),
    onMutate: async ({ id, joined }) => {
      await queryClient.cancelQueries({ queryKey: promotionsKey });
      const previous = queryClient.getQueryData<PromotionsResponse>(promotionsKey);
      queryClient.setQueryData<PromotionsResponse>(promotionsKey, (current) => current ? {
        ...current,
        platform_campaigns: current.platform_campaigns?.map((campaign) => String(campaign.id ?? campaign._id) === id ? { ...campaign, joined } : campaign),
      } : current);
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(promotionsKey, context?.previous);
      toast(error instanceof Error ? error.message : "Failed to update campaign.", "error");
    },
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

  const toggleCampaign = (id: string) => {
    const campaign = platformCampaigns.find((item) => item.id === id);
    if (campaign) campaignMutation.mutate({ id, joined: !campaign.isActive });
  };
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

          {/* Business Promotions Table */}
          {promotionsQuery.isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : promotionsQuery.isError ? (
            <div className="rounded-[32px] border border-red-100 bg-white p-10 text-center text-sm text-red-600">Promotions could not be loaded. <button type="button" onClick={() => promotionsQuery.refetch()} className="font-bold underline">Try again</button></div>
          ) : (
            <PromotionsTable promotions={businessPromotions} onToggleStatus={togglePromotionStatus} />
          )}

          {/* Platform Campaigns */}
          <section className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Platform Campaigns
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Join network-wide events to boost your visibility.
                </p>
              </div>
              <span className="text-sm font-bold text-slate-400">{platformCampaigns.length} opportunities</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {platformCampaigns.length > 0 ? (
                platformCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    {...campaign}
                    isActive={campaign.isActive}
                    onToggle={() => toggleCampaign(campaign.id)}
                  />
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 rounded-[32px] border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No platform campaigns available.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
