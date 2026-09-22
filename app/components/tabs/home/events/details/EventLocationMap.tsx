import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import {
  buildDirectionsUrl,
  buildPlaceUrl,
} from "../../../../../lib/google-maps";
import type { GeoCoordinates } from "../../../../../lib/event-map-types";
import NativeMapboxMap from "../../../../ui/NativeMapboxMap";

type EventLocationMapProps = {
  venueName?: string;
  address?: string;
  coordinates: GeoCoordinates | null;
  origin: GeoCoordinates | null;
};

export default function EventLocationMap({
  venueName,
  address,
  coordinates,
  origin,
}: EventLocationMapProps) {
  const resolvedVenueName = venueName || "Event venue";
  const resolvedAddress = address || "Location not provided.";

  const handleDirections = async () => {
    const url = origin && coordinates
      ? buildDirectionsUrl(origin, coordinates)
      : coordinates
        ? buildPlaceUrl(coordinates)
        : null;

    if (!url) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error: unknown) {
      console.warn("Could not open event directions:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Location & Directions</Text>

      <View style={styles.mapContainer}>
        {coordinates ? (
          <NativeMapboxMap
            center={coordinates}
            height={180}
            zoomLevel={15}
            showUserLocation={Boolean(origin)}
            markers={[{
              id: "event-venue",
              kind: "event",
              coordinate: coordinates,
              children: <View style={styles.eventMarker}><MaterialIcons name="event-note" size={24} color={theme.COLORS.primary} /></View>,
            }]}
          />
        ) : (
          <View style={styles.mapUnavailable}>
            <Ionicons
              name="location-outline"
              size={30}
              color={theme.COLORS.textSecondary}
            />
            <Text style={styles.mapUnavailableText}>
              Map coordinates are not available for this event.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{resolvedVenueName}</Text>
        <Text style={styles.address}>{resolvedAddress}</Text>
      </View>

      <TouchableOpacity
        style={[styles.directionsBtn, !coordinates && styles.directionsBtnDisabled]}
        activeOpacity={0.8}
        onPress={handleDirections}
        disabled={!coordinates}
        accessibilityRole="button"
        accessibilityState={{ disabled: !coordinates }}
      >
        <Ionicons name="navigate" size={20} color={theme.COLORS.textPrimary} />
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  mapContainer: {
    height: 180,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  eventMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 5,
  },
  mapUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  mapUnavailableText: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  venueInfo: {
    marginTop: 15,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  directionsBtnDisabled: {
    opacity: 0.5,
  },
  directionsText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
});


