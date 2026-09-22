// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../../constants/theme";

const ConfirmSummaryCard = ({ restaurant }) => {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.title}>{restaurant.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={theme.COLORS.secondary} />
            <Text style={styles.locationText}>
              {restaurant.location}, {restaurant.distance} away
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
            <Text style={styles.reviewsText}>({restaurant.reviews} reviews)</Text>
          </View>
        </View>
        <Image
          source={restaurant.image}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
});

export default ConfirmSummaryCard;


