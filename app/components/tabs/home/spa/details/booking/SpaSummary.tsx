import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../constants/theme";
import type { NormalizedSpa } from "../../../../../../lib/provider-types";

type SpaSummaryProps = {
  spa: NormalizedSpa;
};

export default function SpaSummary({ spa }: SpaSummaryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={
            spa.imageUrl
              ? { uri: spa.imageUrl }
              : require("../../../../../../assets/images/spa/galley/Rectangle 2.png")
          }
          style={styles.image}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{spa.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={theme.COLORS.primary} />
          <Text style={styles.locationText}>
            {spa.locationText}, {spa.distanceText} away
          </Text>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>{spa.ratingText}</Text>
          <Text style={styles.reviewsText}>({spa.reviewsText} reviews)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    ...theme.SHADOWS.card,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
  },
});


