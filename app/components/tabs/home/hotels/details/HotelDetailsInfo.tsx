import React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import type { NormalizedHotel } from "../../../../../lib/provider-types";
import { formatDistanceKm } from "../../../../../lib/distance";

type HotelDetailsInfoProps = {
  hotel: NormalizedHotel;
};

export default function HotelDetailsInfo({ hotel }: HotelDetailsInfoProps) {
  const isAvailable = hotel.statusText === "Available";
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {hotel.profileImageUrl ? (
          <Image source={{ uri: hotel.profileImageUrl }} style={styles.profileImage} />
        ) : null}
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.title}>{hotel.title}</Text>
          <View style={styles.locationRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#facc15" />
              <Text style={styles.ratingText}>{hotel.ratingText}</Text>
              <Text style={styles.reviewsText}>({hotel.reviewsText})</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.locationBox}>
              <Ionicons
                name="location-outline"
                size={14}
                color={theme.COLORS.textSecondary}
              />
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {hotel.locationText}
              </Text>
            </View>
            {typeof hotel.distanceKm === "number" ? (
              <Text style={styles.distanceText}>{formatDistanceKm(hotel.distanceKm) ?? "Nearby"}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.price}>${hotel.priceText}</Text>
          <Text style={styles.perNight}>/night</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Ionicons 
          name={isAvailable ? "checkmark-circle" : "alert-circle"} 
          size={16} 
          color={isAvailable ? "#22c55e" : "#f59e0b"} 
        />
        <Text style={[styles.statusText, { color: isAvailable ? "#22c55e" : "#f59e0b" }]}>
          {isAvailable ? "Available Now" : hotel.statusText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.COLORS.white,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileImage: {
    width: 52,
    height: 52,
    marginRight: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  reviewsText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "#ddd",
    marginHorizontal: 12,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  distanceText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginLeft: 8,
  },
  priceColumn: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  perNight: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
  },
});


