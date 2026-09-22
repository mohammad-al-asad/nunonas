import type { NormalizedMapEvent } from "./event-map-types";
import type { RestaurantMapItem } from "./restaurant-map";
import type { MapFilterKey } from "../components/ui/MapFilterChips";
import type { GeoCoordinates } from "./event-map-types";

const METRO_PATTERN = /\b(metro|station|subway|rail)\b/i;

export function distanceBetweenKm(
  origin: GeoCoordinates,
  destination: GeoCoordinates,
): number {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const originLatitude = radians(origin.latitude);
  const destinationLatitude = radians(destination.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function attachEventDistances(
  events: NormalizedMapEvent[],
  origin: GeoCoordinates | null,
): NormalizedMapEvent[] {
  if (!origin) return events;
  return events.map((event) => {
    if (event.latitude == null || event.longitude == null) return event;
    const distanceKm = distanceBetweenKm(origin, {
      latitude: event.latitude,
      longitude: event.longitude,
    });
    return {
      ...event,
      distanceKm,
      distance: `${distanceKm.toFixed(1)} km`,
    };
  });
}

export function attachRestaurantDistances(
  restaurants: RestaurantMapItem[],
  origin: GeoCoordinates | null,
): RestaurantMapItem[] {
  if (!origin) return restaurants;
  return restaurants.map((restaurant) => {
    const distanceKm = distanceBetweenKm(origin, restaurant);
    return {
      ...restaurant,
      distanceKm,
      distanceText: `${distanceKm.toFixed(1)} km away`,
    };
  });
}

export function isNearMetroText(...values: Array<string | null | undefined>): boolean {
  return METRO_PATTERN.test(values.filter(Boolean).join(" "));
}

function isEventOpenNow(event: NormalizedMapEvent, now = new Date()): boolean {
  if (event.entityType === "happy_hour") return event.isOpenNow;
  if (!event.eventDate || !event.startTime || !event.endTime) return false;
  const start = new Date(`${event.eventDate}T${event.startTime.slice(0, 8)}`);
  const end = new Date(
    `${event.eventEndDate || event.eventDate}T${event.endTime.slice(0, 8)}`,
  );
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start.getTime() <= now.getTime() && end.getTime() >= now.getTime();
}

export function filterMapEvents(
  events: NormalizedMapEvent[],
  activeFilters: MapFilterKey[],
): NormalizedMapEvent[] {
  return events.filter((event) => {
    if (
      activeFilters.includes("near-me") &&
      event.distanceKm != null &&
      event.distanceKm > 50
    ) {
      return false;
    }
    if (activeFilters.includes("open-now") && !isEventOpenNow(event)) {
      return false;
    }
    if (
      activeFilters.includes("top-rated") &&
      (event.rating == null || event.rating < 4)
    ) {
      return false;
    }
    if (activeFilters.includes("offers") && !event.offerText) {
      return false;
    }
    if (
      activeFilters.includes("near-metro") &&
      !isNearMetroText(event.venue, event.address, event.location)
    ) {
      return false;
    }
    return true;
  });
}

export function filterMapRestaurants(
  restaurants: RestaurantMapItem[],
  activeFilters: MapFilterKey[],
): RestaurantMapItem[] {
  return restaurants.filter((restaurant) => {
    if (
      activeFilters.includes("near-me") &&
      restaurant.distanceKm != null &&
      restaurant.distanceKm > 50
    ) {
      return false;
    }
    if (activeFilters.includes("open-now") && restaurant.isOpenNow !== true) {
      return false;
    }
    if (
      activeFilters.includes("top-rated") &&
      (restaurant.rating == null || restaurant.rating < 4)
    ) {
      return false;
    }
    if (activeFilters.includes("offers") && !restaurant.hasOffer) {
      return false;
    }
    if (activeFilters.includes("near-metro") && !restaurant.nearMetro) {
      return false;
    }
    return true;
  });
}
