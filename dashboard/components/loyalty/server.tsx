import { LoyaltyManagementView } from "@/components/loyalty/client";
import { type LoyaltyConfig, type LoyaltyProvider, defaultLoyaltyConfig } from "@/lib/loyalty";
import { fetchApiData } from "@/lib/server-api";

export async function LoyaltyManagementViewServer() {
  const [config, providers] = await Promise.all([
    fetchApiData<LoyaltyConfig>("/api/loyalty/config", defaultLoyaltyConfig),
    fetchApiData<{ items: LoyaltyProvider[]; min_active_days: number }>("/api/loyalty/providers", { items: [], min_active_days: 30 }),
  ]);
  return <LoyaltyManagementView config={config} providers={providers.items} minActiveDays={providers.min_active_days} />;
}
