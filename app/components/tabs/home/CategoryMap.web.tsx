import React, { useMemo } from "react";
import type { ProviderPayload } from "../../../lib/provider-types";
import type { DiscoveryKind } from "../../../lib/discovery-map";
import type { MapFilterKey } from "../../../components/ui/MapFilterChips";
import DiscoveryMap from "../../ui/DiscoveryMap";
type Props = { items: ProviderPayload[]; loading: boolean; kind: "spa" | "hotel"; activeFilters?: MapFilterKey[] };
export default function CategoryMap({ items, loading, kind, activeFilters }: Props) {
  const mapItems = useMemo(() => items.flatMap((item) => {
    const rawKind = String((item as any).service_type ?? (item as any).entity_type ?? (item as any).type ?? "").trim().toLowerCase();
    const matchesKind = !rawKind || rawKind === kind || (kind === "spa" && rawKind === "spas") || (kind === "hotel" && rawKind === "hotels");
    if (!matchesKind) return [];
    const latitude = Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null;
    const longitude = Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null;
    const id = String(item.id ?? item._id ?? "");
    if (!id) return [];
    return [{ id, title: String(item.title ?? item.name ?? kind), kind: kind as DiscoveryKind, latitude, longitude, location: String(item.location ?? item.address ?? item.city ?? "Location unavailable"), imageUrl: String(item.profile_image_url ?? item.cover_image_url ?? item.image_url ?? item.image ?? ""), rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : null, isOpenNow: item.is_open_now === true, hasOffer: Boolean(item.offer_text || (item as { badge?: unknown }).badge), nearMetro: Boolean(item.near_metro), detailRoute: `/home/${kind === "spa" ? "spa" : "hotels"}/${id}` }];
  }), [items, kind]);
  return <DiscoveryMap items={mapItems} loading={loading} filters={activeFilters} />;
}
