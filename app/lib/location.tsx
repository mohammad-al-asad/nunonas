import * as Location from "expo-location";
import type { GeoCoordinates } from "./event-map-types";

export function isExpectedLocationError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : "").toLowerCase();

  return (
    message.includes("location services") ||
    message.includes("current location is unavailable") ||
    message.includes("permission")
  );
}

export async function getCurrentCoords(
  options: Partial<Location.LocationOptions> = {},
): Promise<GeoCoordinates | null> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return null;
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  // A fresh high-accuracy GPS fix can take several seconds (longer indoors).
  // Reuse a recent, precise fix when the device already has one.
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 2 * 60_000, requiredAccuracy: 100 });
  if (lastKnown) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
      accuracy: lastKnown.coords.accuracy ?? null,
    };
  }

  const position = await Location.getCurrentPositionAsync({
    // Nearby distances need the device's actual position, not a balanced
    // network estimate that can be hundreds of metres stale.
    accuracy: Location.Accuracy.Highest,
    ...options,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
  };
}
