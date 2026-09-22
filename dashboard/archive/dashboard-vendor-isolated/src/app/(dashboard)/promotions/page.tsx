"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  MousePointer2,
  Plus,
  Tag,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PromotionsTable, Promotion } from "@/components/PromotionsTable";
import { CampaignCard } from "@/components/CampaignCard";
import {
  vendorListPromotions,
  vendorUpdatePromotionStatus,
  vendorJoinPlatformCampaign,
} from "@/lib/vendor-api";


const STATS = [
  {
    label: "TOTAL PROMO REVENUE",
    value: "$24,482",
    trend: "+12%",
    trendColor: "text-emerald-500",
    icon: TrendingUp,
    bg: "bg-white",
  },
  {
    label: "ACTIVE PROMOTIONS",
    value: "8",
    subtext: "Across 3 locations",
    icon: Tag,
    bg: "bg-white",
  },
  {
    label: "CAMPAIGN REACH",
    value: "142.5k",
    icon: Users,
    bg: "bg-white",
  },
  {
    label: "AVG. CONVERSION",
    value: "18.4%",
    trend: "0%",
    trendColor: "text-slate-400",
    icon: MousePointer2,
    bg: "bg-white",
  },
];

const BUSINESS_PROMOTIONS: Promotion[] = [
  {
    id: "1",
    name: "Weekend Brunch Special",
    description: "Available at Main Dining Hall",
    type: "PERCENTAGE",
    value: "20% Off",
    schedule: "Sat - Sun",
    usageCount: 342,
    usageMax: 500,
    isActive: true,
  },
  {
    id: "2",
    name: "Late Night Happy Hour",
    description: "Bar & Lounge Area",
    type: "HAPPY HOUR",
    value: "BOGO Drinks",
    schedule: "10 PM - 1 AM",
    usageCount: 892,
    usageMax: 960,
    isActive: true,
  },
  {
    id: "3",
    name: "Spa Day Package",
    description: "Wellness Center",
    type: "FIXED",
    value: "$150 Total",
    schedule: "Weekdays",
    usageCount: 12,
    usageMax: 240,
    isActive: false,
  },
];

const PLATFORM_CAMPAIGNS = [
  {
    id: "c1",
    title: "Flash Sale Friday",
    description: "Sitewide 24-hour frenzy event.",
    requirement: "Requirement",
    requirementValue: "30% Min Discount",
    duration: "Duration",
    durationValue: "24 Hours (Fri)",
    boostType: "visibility" as const,
    boostText: "+40% VISIBILITY BOOST",
    boostSubtext: "Search & Category placement",
    commission: "+2.0%",
    isActive: false,
  },
  {
    id: "c2",
    title: "New User Specials",
    description: "Targeting customers' first orders.",
    requirement: "Requirement",
    requirementValue: "$10 Fixed Off",
    duration: "Duration",
    durationValue: "Continuous",
    boostType: "acquisition" as const,
    boostText: "+25% ACQUISITION",
    boostSubtext: "Priority in 'Offers for you'",
    commission: "Standard",
    isActive: true,
  },
  {
    id: "c3",
    title: "Gourmet Week 2026",
    description: "Premium dining collection promo.",
    requirement: "Requirement",
    requirementValue: "Set Menu Only",
    duration: "Duration",
    durationValue: "Feb 12 - Feb 20",
    boostType: "premium" as const,
    boostText: "PREMIUM BADGE",
    boostSubtext: "Social media promotion included",
    commission: "+1.5%",
    isActive: false,
  },
];

export default function PromotionsPage() {
  const [businessPromotions, setBusinessPromotions] = useState<Promotion[]>([]);
  const [campaignStates, setCampaignStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchPromotions = useCallback(async () => {
    try {
      const raw = await vendorListPromotions() as { items?: Record<string, unknown>[] };
      const items = raw?.items ?? [];
      const normalized: Promotion[] = items.map((p) => ({
        id: (p.id ?? p._id ?? "") as string,
        name: (p.name ?? p.title ?? "") as string,
        description: (p.description ?? "") as string,
        type: (p.type ?? "PERCENTAGE") as string,
        value: (p.value ?? "") as string,
        schedule: (p.schedule ?? "") as string,
        usageCount: (p.usage_count ?? p.usageCount ?? 0) as number,
        usageMax: (p.usage_max ?? p.usageMax ?? 100) as number,
        isActive: (p.is_active ?? p.isActive ?? false) as boolean,
      }));
      setBusinessPromotions(normalized);
    } catch (err) {
      console.warn("Failed to load promotions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const toggleCampaign = async (id: string) => {
    const newState = !campaignStates[id];
    setCampaignStates((prev) => ({ ...prev, [id]: newState }));
    try {
      await vendorJoinPlatformCampaign(id, newState);
    } catch (err) {
      console.warn("Failed to update campaign state:", err);
      // Revert on failure
      setCampaignStates((prev) => ({ ...prev, [id]: !newState }));
    }
  };

  // Keep platform campaigns as static since they come from the platform
  const platformCampaigns = PLATFORM_CAMPAIGNS;


  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Promotions" />

      <main className="flex-1 p-6 md:p-10 space-y-10">
        <div className="max-w-[1400px] mx-auto space-y-10">
          {/* Page Title & Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Marketing Overview
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage your internal offers and discover platform growth
                opportunities.
              </p>
            </div>
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
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </span>
                    {stat.trend && (
                      <span
                        className={cn("text-[10px] font-bold", stat.trendColor)}
                      >
                        {stat.trend}
                      </span>
                    )}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PromotionsTable promotions={businessPromotions} />
          )}

          {/* Platform Campaigns */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Platform Campaigns
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Join network-wide events to boost your visibility.
                </p>
              </div>
              <button className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group">
                View All Opportunities
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {platformCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  {...campaign}
                  isActive={campaignStates[campaign.id] ?? campaign.isActive}
                  onToggle={() => toggleCampaign(campaign.id)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
