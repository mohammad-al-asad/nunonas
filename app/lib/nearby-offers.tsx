import { getMapEvents, getMapHappyHours } from "./customer-events";
import { getMapPins } from "./customer-api";
import { isEventNotExpired, normalizeMapEvent } from "./event-map-utils";
import type {
  CustomerMapEventPayload,
  NormalizedMapEvent,
} from "./event-map-types";

function itemsFromFeed(
  response: PromiseSettledResult<{ items?: CustomerMapEventPayload[] }>,
  entityType: "event" | "happy_hour",
): CustomerMapEventPayload[] {
  if (response.status !== "fulfilled" || !Array.isArray(response.value.items)) {
    return [];
  }

  // The endpoint is authoritative. This prevents stale or malformed entity_type
  // fields from moving an Event into the Happy Hours tab (or vice versa).
  return response.value.items.map((item) => ({
    ...item,
    entity_type: entityType,
    entityType,
  }));
}

export async function listNearbyOffers(limit = 12): Promise<NormalizedMapEvent[]> {
  const responses = await Promise.allSettled([
    getMapEvents(limit),
    getMapHappyHours(limit),
  ]);
  if (responses.every((response) => response.status === "rejected")) {
    const failure = responses.find(
      (response) => response.status === "rejected",
    );
    throw failure?.status === "rejected" && failure.reason instanceof Error
      ? failure.reason
      : new Error("Nearby events and Happy Hours could not be loaded.");
  }
  const items = [
    ...itemsFromFeed(responses[0], "event"),
    ...itemsFromFeed(responses[1], "happy_hour"),
  ];
  const seen = new Set<string>();

  return items
    .map((item) => normalizeMapEvent(item))
    .filter(
      (item) => {
        const key = `${item.entityType}:${item.id}`;
        if (
          !item.id ||
          seen.has(key) ||
          item.latitude == null ||
          item.longitude == null ||
          (item.entityType !== "happy_hour" &&
            !isEventNotExpired(
              item.eventDate,
              item.endTime,
              item.eventEndDate,
            ))
        ) {
          return false;
        }
        seen.add(key);
        return true;
      },
    )
    .sort((left, right) => {
      const leftDistance = left.distanceKm ?? Number.MAX_SAFE_INTEGER;
      const rightDistance = right.distanceKm ?? Number.MAX_SAFE_INTEGER;
      return leftDistance - rightDistance;
    });
}

export type NearbyMapPin = {
  id: string;
  title: string;
  entityType: "restaurant" | "hotel" | "spa" | "event" | "happy_hour";
  serviceType: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  imageUrl: string;
  offerText: string;
  detailRoute: string;
  /** Everything the API sent for this pin (times, price, terms...). */
  payload: CustomerMapEventPayload;
};

export async function listNearbyMapPins(limit = 50): Promise<NearbyMapPin[]> {
  const response = await getMapPins<{ items?: Record<string, unknown>[] }>(limit);
  const seen = new Set<string>();
  return (Array.isArray(response?.items) ? response.items : [])
    .map((row) => {
      const entityType = String(row.entity_type ?? row.entityType ?? row.service_type ?? "restaurant").trim().toLowerCase() as NearbyMapPin["entityType"];
      const id = String(row.id ?? row._id ?? "");
      const latitude = Number(row.latitude ?? row.lat);
      const longitude = Number(row.longitude ?? row.lng);
      const venueType = String(row.venue_type ?? "restaurant").trim().toLowerCase();
      // A happy hour opens its venue's page, so it needs the provider id, not its own.
      const pageId = entityType === "happy_hour" ? String(row.vendor_id ?? id) : id;
      const pageType = entityType === "happy_hour" ? venueType : entityType;
      const detailRoute = typeof row.detail_route === "string" && row.detail_route
        ? row.detail_route
        : pageType === "hotel"
          ? `/home/hotels/${pageId}`
          : pageType === "spa"
            ? `/home/spa/${pageId}`
            : pageType === "event"
              ? `/home/events/${pageId}`
              : `/home/dining/${pageId}`;
      return {
        id,
        title: String(row.title ?? row.name ?? row.venue ?? "Nearby place"),
        entityType,
        serviceType: entityType,
        latitude,
        longitude,
        distanceKm: Number.isFinite(Number(row.distance_km)) ? Number(row.distance_km) : null,
        imageUrl: String(row.profile_image_url ?? row.cover_image_url ?? row.image_url ?? row.image ?? ""),
        offerText: String(row.offer_text ?? row.promotion_name ?? (entityType === "event" ? "Event" : entityType === "happy_hour" ? "Happy Hour" : entityType)),
        detailRoute,
        payload: row as CustomerMapEventPayload,
      };
    })
    .filter((item) => {
      const key = `${item.entityType}:${item.id}`;
      if (!item.id || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER));
}

export function normalizeNearbyMapPins(pins: NearbyMapPin[]): NormalizedMapEvent[] {
  return pins.map((pin) => normalizeMapEvent({
    ...pin.payload,
    id: pin.id,
    title: pin.title,
    name: pin.title,
    entity_type: pin.entityType,
    entityType: pin.entityType,
    service_type: pin.serviceType,
    latitude: pin.latitude,
    longitude: pin.longitude,
    distance_km: pin.distanceKm,
    profile_image_url: pin.imageUrl,
    image_url: pin.imageUrl,
    offer_text: pin.offerText,
    location: String(pin.payload.location ?? pin.payload.address ?? pin.payload.venue ?? "Nearby"),
    detail_route: pin.detailRoute,
  }));
}
