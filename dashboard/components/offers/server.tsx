import { OffersManagementView } from "@/components/offers/client";
import type { PlatformOffer } from "@/lib/offers-admin";
import { fetchApiData } from "@/lib/server-api";

export async function OffersManagementViewServer() {
  const data = await fetchApiData<{ offers: PlatformOffer[] }>("/api/offers", { offers: [] });
  return <OffersManagementView initialOffers={data.offers ?? []} />;
}
