import React from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import type { NormalizedRestaurant, ProviderPayload } from "../../../../../lib/provider-types";

type DetailsInfoProps = {
  restaurant: NormalizedRestaurant;
  offers?: ProviderPayload[];
};

export default function DetailsInfo({ restaurant }: DetailsInfoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {restaurant.profileImageUrl ? (
          <Image source={{ uri: restaurant.profileImageUrl }} style={styles.profileImage} />
        ) : null}
        <Text style={styles.title}>{restaurant.title}</Text>
      </View>

      <View style={styles.ratingRow}>
        <Ionicons name="star" size={18} color="#f59e0b" />
        <Text style={styles.ratingText}>{restaurant.ratingText}</Text>
        <Text style={styles.reviewText}>({restaurant.reviewsText} reviews)</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.subText}>{restaurant.category}</Text>
        <View style={styles.dot} />
        <Text style={styles.priceText}>{restaurant.priceRange}</Text>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location" size={18} color={theme.COLORS.primary} />
        <Text style={styles.locationText}>
          {[restaurant.locationText, restaurant.distanceText].filter(Boolean).join(", ")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.COLORS.border,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginLeft: 6,
  },
  reviewText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  subText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.COLORS.textSecondary,
    marginHorizontal: 10,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
});


