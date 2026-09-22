import type { CustomerMapEventPayload, NormalizedMapEvent } from "./event-map-types";

export function formatEventDate(value?: string | null): string {
  if (!value) {
    return "Date TBA";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatEventDateRange(
  startDate?: string | null,
  endDate?: string | null,
): string {
  const start = formatEventDate(startDate);
  if (!endDate || endDate === startDate) {
    return start;
  }
  return `${start} - ${formatEventDate(endDate)}`;
}

export function formatEventTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) {
    return "Time TBA";
  }

  const start = String(startTime).slice(0, 5);
  const end = endTime ? String(endTime).slice(0, 5) : "";
  return end ? `${start} - ${end}` : start;
}

export function getDistanceText(distanceKm: number | null): string {
  if (typeof distanceKm !== "number") {
    return "Nearby";
  }

  return `${distanceKm.toFixed(1)} km`;
}

export function getFirstQueryParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function isEventNotExpired(
  eventDate?: string | null,
  endTime?: string | null,
  eventEndDate?: string | null,
): boolean {
  const finalDate = eventEndDate || eventDate;
  if (!finalDate || !endTime) {
    return false;
  }

  const end = new Date(`${finalDate}T${String(endTime).slice(0, 8)}`);
  return !Number.isNaN(end.getTime()) && end.getTime() >= Date.now();
}

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeMapEvent(item: CustomerMapEventPayload = {}): NormalizedMapEvent {
  const distanceValue = toNumber(item.distance_km) ?? item.distanceKm ?? null;
  const entityType = String(item.entity_type ?? item.entityType ?? item.service_type ?? "event").trim().toLowerCase();
  const location = item.location ?? item.venue ?? "Venue available";
  const address = item.address ?? item.locationLabel ?? item.location ?? item.venue ?? "Address available";
  const ticketPriceValue = toNumber(item.ticket_price) ?? toNumber(item.ticketPrice);
  const remainingCapacity = toNumber(item.remaining_capacity) ?? item.remainingCapacity ?? null;

  return {
    id: item.id ?? item._id ?? "",
    entityType,
    title: item.title ?? item.name ?? "Untitled Event",
    date: formatEventDateRange(item.event_date, item.end_date),
    time: formatEventTime(item.start_time, item.end_time),
    eventDate: item.event_date ?? null,
    eventEndDate: item.end_date ?? item.event_date ?? null,
    startTime: item.start_time ?? null,
    endTime: item.end_time ?? null,
    location,
    locationLabel: item.locationLabel ?? address,
    venue: item.venue ?? item.location ?? "Venue available",
    address,
    tag: item.offer_text ?? item.offerText ?? item.event_type ?? item.eventType ?? "Live Event",
    offerText: item.offer_text ?? item.offerText ?? "",
    eventType:
      item.event_category ??
      item.eventCategory ??
      item.event_type ??
      item.eventType ??
      "Culture",
    // Events must use their banner. Venue cards use their profile image so the
    // image shown beside the name matches the venue's detail page.
    imageUrl: entityType === "event"
      ? item.banner_image_url ?? ""
      : item.profile_image_url ?? item.image_url ?? item.imageUrl ?? item.cover_image_url ?? "",
    profileImageUrl: item.profile_image_url ?? "",
    description: item.description ?? "",
    capacity: toNumber(item.capacity),
    ticketPrice: ticketPriceValue != null ? `${ticketPriceValue}` : null,
    distance: getDistanceText(distanceValue),
    distanceKm: distanceValue,
    rating: item.rating ?? null,
    reviewsCount: item.reviews_count ?? item.reviewsCount ?? null,
    latitude: toNumber(item.latitude),
    longitude: toNumber(item.longitude),
    canBookOnMap: Boolean(item.can_book_on_map ?? item.canBookOnMap),
    currentBookingStatus: item.current_booking_status ?? item.currentBookingStatus ?? "",
    currentBookingCode: item.current_booking_code ?? item.currentBookingCode ?? "",
    isSoldOut: Boolean(item.is_sold_out ?? item.isSoldOut),
    remainingCapacity,
    registrationDeadline: item.registration_deadline ?? null,
    registrationOpen: item.registration_open !== false,
    isOpenNow: Boolean(item.is_open_now ?? item.isOpenNow),
    detailRoute:
      item.detail_route ??
      item.detailRoute ??
      (entityType === "event" && item.id
        ? `/home/events/${item.id}`
        : null),
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
