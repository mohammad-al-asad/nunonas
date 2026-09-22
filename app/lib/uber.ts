import { Alert, Linking } from "react-native";

export type UberRideOptions = {
  latitude?: number | null;
  longitude?: number | null;
  title?: string | null;
  address?: string | null;
};

/**
 * Opens the Uber app (or mobile web fallback) with pickup set to the user's
 * current location and dropoff pre-filled with the destination's coordinates.
 */
export async function openUberRide({
  latitude,
  longitude,
  title,
  address,
}: UberRideOptions): Promise<void> {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    Alert.alert(
      "Location Unavailable",
      "Location coordinates are not available for this venue.",
    );
    return;
  }

  const queryParams = new URLSearchParams({
    action: "setPickup",
    pickup: "my_location",
    "dropoff[latitude]": String(latitude),
    "dropoff[longitude]": String(longitude),
  });

  if (title?.trim()) {
    queryParams.set("dropoff[nickname]", title.trim());
  }

  if (address?.trim()) {
    queryParams.set("dropoff[formatted_address]", address.trim());
  }

  const queryString = queryParams.toString();
  const nativeUrl = `uber://?${queryString}`;
  const webUrl = `https://m.uber.com/ul/?${queryString}`;

  try {
    const isSupported = await Linking.canOpenURL(nativeUrl);
    if (isSupported) {
      await Linking.openURL(nativeUrl);
      return;
    }
  } catch {
    // Fall back to web URL below
  }

  try {
    await Linking.openURL(webUrl);
  } catch (error) {
    Alert.alert(
      "Unable to Open Uber",
      "Could not open the Uber application or browser.",
    );
  }
}
