import { getErrorMessage } from "./event-map-utils";
import type {
  NormalizedHotel,
  NormalizedRestaurant,
  NormalizedSpa,
  ProviderPayload,
} from "./provider-types";

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

function getDistanceText(distance: string | number | null | undefined): string {
  if (typeof distance === "number") {
    return `${distance.toFixed(1)} km`;
  }

  if (typeof distance === "string" && distance.trim()) {
    return distance.trim();
  }

  return "Nearby";
}

function getLocationText(payload: ProviderPayload): string {
  return payload.location ?? payload.address ?? payload.city ?? "Location unavailable";
}

function getReviewsCount(payload: ProviderPayload): number {
  return toNumber(payload.reviews_count) ?? toNumber(payload.reviews) ?? 0;
}

function getRatingText(payload: ProviderPayload): string {
  const rating = toNumber(payload.rating);
  return rating != null ? rating.toFixed(1) : "4.5";
}

export function normalizeRestaurant(payload: ProviderPayload = {}): NormalizedRestaurant {
  const reviewsCount = getReviewsCount(payload);
  return {
    id: String(payload.id ?? payload._id ?? ""),
    title: payload.title ?? payload.name ?? "Restaurant",
    ratingText: getRatingText(payload),
    reviewsText: String(reviewsCount),
    reviewsCount,
    category: payload.cuisine ?? payload.category ?? "Dining",
    priceRange: payload.price_range ?? payload.priceRange ?? "$$$",
    distanceText: getDistanceText(toNumber(payload.distance_km) ?? payload.distance),
    locationText: getLocationText(payload),
    profileImageUrl: payload.profile_image_url ?? "",
    imageUrl: payload.cover_image_url ?? payload.image_url ?? payload.image ?? payload.asset_url ?? payload.url ?? "",
    description:
      payload.description ??
      "Discover venue details, opening times, menus, and booking options from the app.",
    amenities: payload.amenities ?? ["Free WiFi", "Parking", "Outdoor", "Cards", "Accessible", "Bar"],
    seatingPreferences: payload.seating_preferences ?? ["Indoor", "Outdoor", "No preference"],
    phone: payload.phone ?? payload.contact?.phone ?? "",
    latitude: toNumber(payload.latitude),
    longitude: toNumber(payload.longitude),
    bookingPolicy: payload.booking_policy ?? payload.policy ?? "You can modify or cancel this booking later.",
    openingHours: payload.opening_hours,
  };
}

export function normalizeHotel(payload: ProviderPayload = {}): NormalizedHotel {
  const reviewsCount = getReviewsCount(payload);
  const price = toNumber(payload.price);
  const description =
    payload.about ??
    payload.description ??
    "Explore room availability, amenities, and stay details directly from the app.";
  const locationText = getLocationText(payload);
  return {
    id: String(payload.id ?? payload._id ?? ""),
    title: payload.title ?? payload.name ?? "Hotel",
    ratingText: getRatingText(payload),
    reviewsText: String(reviewsCount),
    reviewsCount,
    priceText: price != null ? `${price}` : "0",
    priceRange: payload.price_range ?? payload.priceRange ?? "$$$",
    locationText,
    profileImageUrl: payload.profile_image_url ?? "",
    imageUrl: payload.cover_image_url ?? payload.image_url ?? payload.image ?? payload.asset_url ?? payload.url ?? "",
    statusText: payload.status ?? "Available",
    distanceKm: toNumber(payload.distance_km),
    description,
    about: description,
    address: payload.address ?? payload.location ?? "",
    location: payload.location ?? payload.address ?? locationText,
    amenities: payload.amenities ?? [],
    offers: (payload.offers ?? []).filter((offer) => offer.active !== false),
    phone: payload.phone ?? payload.contact?.phone ?? "",
    latitude: toNumber(payload.latitude),
    longitude: toNumber(payload.longitude),
    openingHours: payload.opening_hours,
  };
}

export function normalizeSpa(payload: ProviderPayload = {}): NormalizedSpa {
  const reviewsCount = getReviewsCount(payload);
  return {
    id: String(payload.id ?? payload._id ?? ""),
    title: payload.title ?? payload.name ?? "Spa",
    ratingText: getRatingText(payload),
    reviewsText: String(reviewsCount),
    reviewsCount,
    category: payload.cuisine ?? payload.category ?? "Wellness",
    typeText: payload.type ?? "Spa",
    distanceText: getDistanceText(toNumber(payload.distance_km) ?? payload.distance),
    locationText: getLocationText(payload),
    profileImageUrl: payload.profile_image_url ?? "",
    imageUrl: payload.cover_image_url ?? payload.image_url ?? payload.image ?? payload.asset_url ?? payload.url ?? "",
    description:
      payload.description ??
      "Check treatment details, timing, and reservation options before you book.",
    amenities: payload.amenities ?? ["Free WiFi", "Parking", "Locker", "Shower", "Accessible", "Sauna"],
    phone: payload.phone ?? payload.contact?.phone ?? "",
    latitude: toNumber(payload.latitude),
    longitude: toNumber(payload.longitude),
    openingHours: payload.opening_hours,
  };
}

export { getErrorMessage };
