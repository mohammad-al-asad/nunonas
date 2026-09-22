import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import theme from "../../../../../constants/theme";
import type { GeoCoordinates } from "../../../../../lib/event-map-types";
import {
  buildDirectionsUrl,
  buildPlaceUrl,
} from "../../../../../lib/google-maps";
import GoogleWebMap from "../../../../ui/GoogleWebMap";

type EventLocationMapProps = {
  venueName?: string;
  address?: string;
  coordinates: GeoCoordinates | null;
  origin: GeoCoordinates | null;
};

export default function EventLocationMapWeb({
  venueName,
  address,
  coordinates,
  origin,
}: EventLocationMapProps) {
  const resolvedVenueName = venueName || "Event venue";
  const resolvedAddress = address || "Location not provided.";

  const handleDirections = async () => {
    const url =
      origin && coordinates
        ? buildDirectionsUrl(origin, coordinates)
        : coordinates
          ? buildPlaceUrl(coordinates)
          : null;

    if (!url) return;

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
          <GoogleWebMap
            center={coordinates}
            markers={[
              {
                id: "event-location",
                title: resolvedVenueName,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                kind: "event",
              },
            ]}
            selectedId="event-location"
            height={180}
            zoomLevel={15}
            showCenterMarker={false}
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
        <Ionicons
          name="navigate"
          size={20}
          color={theme.COLORS.textPrimary}
        />
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
