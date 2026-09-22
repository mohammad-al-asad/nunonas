import type { DrivingRoute, GeoCoordinates } from "./event-map-types";

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
type StaticMapOptions = {
  center?: string | GeoCoordinates | null;
  zoom?: number;
  width?: number;
  height?: number;
  scale?: number;
  markerLabel?: string;
};

type GoogleGeocodeResult = {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

function parseCenter(center: StaticMapOptions["center"]): GeoCoordinates | null {
  if (!center) return null;
  if (typeof center !== "string") return center;
  const values = center.split(",").map((value) => Number(value.trim()));
  if (
    values.length !== 2 ||
    values.some((value) => !Number.isFinite(value))
  ) {
    return null;
  }
  return { latitude: values[0], longitude: values[1] };
}

function formatDistance(meters: number | null | undefined): string | null {
  if (!Number.isFinite(meters)) return null;
  return meters! >= 1000
    ? `${(meters! / 1000).toFixed(1)} km`
    : `${Math.round(meters!)} m`;
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!Number.isFinite(seconds)) return null;
  const minutes = Math.max(Math.round(seconds! / 60), 1);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function decodePolyline(encoded: string): GeoCoordinates[] {
  const coordinates: GeoCoordinates[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

export function buildStaticMapUrl({
  center,
  zoom = 14,
  width = 600,
  height = 300,
  scale = 2,
  markerLabel,
}: StaticMapOptions = {}): string | null {
  const coordinates = parseCenter(center);
  if (!GOOGLE_MAPS_API_KEY || !coordinates) return null;

  const clampedWidth = Math.min(Math.max(Math.round(width), 1), 640);
  const clampedHeight = Math.min(Math.max(Math.round(height), 1), 640);
  const label = markerLabel?.trim().slice(0, 1).toUpperCase();
  const marker = [
    "color:0x1e3a8a",
    label ? `label:${label}` : "",
    `${coordinates.latitude},${coordinates.longitude}`,
  ]
    .filter(Boolean)
    .join("|");
  const params = new URLSearchParams({
    center: `${coordinates.latitude},${coordinates.longitude}`,
    zoom: String(zoom),
    size: `${clampedWidth}x${clampedHeight}`,
    scale: scale >= 2 ? "2" : "1",
    maptype: "roadmap",
    markers: marker,
    key: GOOGLE_MAPS_API_KEY,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export async function forwardGeocode(
  query: string,
): Promise<GeoCoordinates | null> {
  if (!GOOGLE_MAPS_API_KEY || !query.trim()) return null;
  try {
    const params = new URLSearchParams({
      address: query.trim(),
      key: GOOGLE_MAPS_API_KEY,
    });
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status?: string;
      results?: GoogleGeocodeResult[];
    };
    const location = data.results?.[0]?.geometry?.location;
    return data.status === "OK" &&
      Number.isFinite(location?.lat) &&
      Number.isFinite(location?.lng)
      ? { latitude: Number(location?.lat), longitude: Number(location?.lng) }
      : null;
  } catch (error) {
    console.error("Google forward geocoding failed:", error);
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: GOOGLE_MAPS_API_KEY,
    });
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status?: string;
      results?: GoogleGeocodeResult[];
    };
    return data.status === "OK"
      ? data.results?.[0]?.formatted_address ?? null
      : null;
  } catch (error) {
    console.error("Google reverse geocoding failed:", error);
    return null;
  }
}

export async function getDrivingRoute(
  origin: GeoCoordinates | null,
  destination: GeoCoordinates | null,
): Promise<DrivingRoute | null> {
  if (!origin || !destination || (!GOOGLE_MAPS_API_KEY && !MAPBOX_ACCESS_TOKEN)) return null;
  try {
    const googleRequest = GOOGLE_MAPS_API_KEY
      ? fetch(`https://maps.googleapis.com/maps/api/directions/json?${new URLSearchParams({
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode: "driving",
          departure_time: "now",
          traffic_model: "best_guess",
          alternatives: "false",
          key: GOOGLE_MAPS_API_KEY,
        }).toString()}`).then((response) => response.ok ? response.json() : null)
      : Promise.resolve(null);
    const mapboxRequest = MAPBOX_ACCESS_TOKEN
      ? fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?${new URLSearchParams({
          alternatives: "true",
          geometries: "geojson",
          overview: "full",
          access_token: MAPBOX_ACCESS_TOKEN,
        }).toString()}`).then((response) => response.ok ? response.json() : null)
      : Promise.resolve(null);

    const [googleData, mapboxData] = await Promise.all([googleRequest, mapboxRequest]) as [
      { routes?: Array<{ overview_polyline?: { points?: string }; legs?: Array<{ distance?: { value?: number }; duration?: { value?: number }; duration_in_traffic?: { value?: number } }> }>; status?: string } | null,
      { routes?: Array<{ distance?: number; geometry?: { coordinates?: Array<[number, number]> } }> } | null,
    ];
    const googleRoute = googleData?.status === "OK" ? googleData.routes?.[0] : undefined;
    const googleLeg = googleRoute?.legs?.[0];
    const shortestMapboxRoute = [...(mapboxData?.routes ?? [])]
      .filter((route) => Number.isFinite(route.distance))
      .sort((left, right) => Number(left.distance) - Number(right.distance))[0];
    if (!googleLeg && !shortestMapboxRoute) return null;

    const googleDistanceMeters = googleLeg?.distance?.value ?? null;
    const shortestDistanceMeters = shortestMapboxRoute?.distance ?? null;
    const distanceMeters = shortestDistanceMeters ?? googleDistanceMeters;
    // Google supplies the live traffic ETA; Mapbox supplies the shortest route distance.
    const durationSeconds = googleLeg?.duration_in_traffic?.value ?? googleLeg?.duration?.value ?? null;
    const mapboxCoordinates = (shortestMapboxRoute?.geometry?.coordinates ?? []).map(([longitude, latitude]) => ({ latitude, longitude }));
    const googleCoordinates = decodePolyline(googleRoute?.overview_polyline?.points ?? "");
    return {
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      distanceText: formatDistance(distanceMeters),
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      durationText: formatDuration(durationSeconds),
      coordinates: mapboxCoordinates.length ? mapboxCoordinates : googleCoordinates,
    };
  } catch (error) {
    console.error("Google directions failed:", error);
    return null;
  }
}

export function buildDirectionsUrl(
  origin: GeoCoordinates | null,
  destination: GeoCoordinates | null,
): string | null {
  if (!origin || !destination) return null;
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildPlaceUrl(
  destination: GeoCoordinates | null,
): string | null {
  if (!destination) return null;
  const params = new URLSearchParams({
    api: "1",
    query: `${destination.latitude},${destination.longitude}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
