import React, { useMemo } from "react";
import type { ProviderPayload } from "../../../../lib/provider-types";
import { normalizeRestaurantMapItems } from "../../../../lib/restaurant-map";
import type { MapFilterKey } from "../../../ui/MapFilterChips";
import DiscoveryMap from "../../../ui/DiscoveryMap";
type Props = { restaurants: ProviderPayload[]; loading: boolean; activeFilters: MapFilterKey[] };
export default function RestaurantMap({ restaurants, loading, activeFilters }: Props) {
  const items = useMemo(() => normalizeRestaurantMapItems(restaurants).map((item) => ({ ...item, kind: "restaurant" as const, detailRoute: `/home/dining/${item.id}` })), [restaurants]);
  return <DiscoveryMap items={items} loading={loading} filters={activeFilters} />;
}
