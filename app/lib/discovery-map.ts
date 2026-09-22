import type { MapFilterKey } from "../components/ui/MapFilterChips";
import type { GeoCoordinates } from "./event-map-types";

export type DiscoveryKind = "restaurant" | "event" | "spa" | "hotel";

export type DiscoveryMapItem = {
  id: string;
  title: string;
  kind: DiscoveryKind;
  latitude: number | null;
  longitude: number | null;
  location: string;
  imageUrl?: string;
  rating?: number | null;
  distanceKm?: number | null;
  isOpenNow?: boolean;
  hasOffer?: boolean;
  nearMetro?: boolean;
  detailRoute: string;
};

export function distanceKm(origin: GeoCoordinates, item: DiscoveryMapItem): number | null {
  if (item.latitude == null || item.longitude == null) return null;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(item.latitude - origin.latitude);
  const dLng = radians(item.longitude - origin.longitude);
  const lat1 = radians(origin.latitude);
  const lat2 = radians(item.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterDiscoveryItems(items: DiscoveryMapItem[], origin: GeoCoordinates | null, filters: MapFilterKey[]): DiscoveryMapItem[] {
  return items.map((item) => ({ ...item, distanceKm: origin ? distanceKm(origin, item) : item.distanceKm })).filter((item) => {
    if (filters.includes("near-me") && item.distanceKm != null && item.distanceKm > 50) return false;
    if (filters.includes("open-now") && item.isOpenNow !== true) return false;
    if (filters.includes("top-rated") && (item.rating == null || item.rating < 4)) return false;
    if (filters.includes("offers") && !item.hasOffer) return false;
    if (filters.includes("near-metro") && !item.nearMetro) return false;
    return true;
  });
}
