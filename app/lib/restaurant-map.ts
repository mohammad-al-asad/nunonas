import type { ProviderPayload } from "./provider-types";
import { isNearMetroText } from "./map-filtering";

export type RestaurantMapItem = {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  rating: number | null;
  distanceKm: number | null;
  distanceText: string;
  isOpenNow: boolean;
  hasOffer: boolean;
  nearMetro: boolean;
};

function coordinate(value: ProviderPayload["latitude"]): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeRestaurantMapItem(
  restaurant: ProviderPayload,
): RestaurantMapItem | null {
  const latitude = coordinate(restaurant.latitude);
  const longitude = coordinate(restaurant.longitude);
  if (
    latitude == null ||
    longitude == null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const rating = coordinate(restaurant.rating);
  const distance = coordinate(restaurant.distance_km);
  return {
    id: String(restaurant.id ?? restaurant._id ?? ""),
    title: restaurant.title ?? restaurant.name ?? "Restaurant",
    location:
      restaurant.address ??
      restaurant.location ??
      restaurant.city ??
      "Location unavailable",
    latitude,
    longitude,
    imageUrl:
      restaurant.profile_image_url ??
      restaurant.cover_image_url ??
      restaurant.image_url ??
      restaurant.image ??
      "",
    rating,
    distanceKm: distance,
    distanceText:
      distance != null
        ? `${distance.toFixed(1)} km away`
        : typeof restaurant.distance === "string" && restaurant.distance.trim()
          ? restaurant.distance.trim()
          : "Nearby",
    isOpenNow:
      restaurant.is_open_now === true ||
      restaurant.opening_hours?.is_open_now === true,
    hasOffer:
      Boolean(restaurant.offer_text) ||
      Boolean(restaurant.offers?.some((offer) => offer.active !== false)),
    nearMetro:
      restaurant.near_metro === true ||
      isNearMetroText(
        restaurant.metro_station,
        restaurant.nearest_metro_station,
        restaurant.address,
        restaurant.location,
        restaurant.city,
      ),
  };
}

export function normalizeRestaurantMapItems(
  restaurants: ProviderPayload[],
): RestaurantMapItem[] {
  return restaurants
    .map(normalizeRestaurantMapItem)
    .filter((item): item is RestaurantMapItem => item != null && Boolean(item.id));
}
