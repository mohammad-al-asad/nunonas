// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../ui/Button";
import SaveButton from "../../../ui/SaveButton";
import { formatDistanceKm } from "../../../../lib/distance";

function getImageSource(restaurant) {
  if (restaurant?.image?.uri || restaurant?.image?.width) {
    return restaurant.image;
  }
  if (restaurant?.cover_image_url || restaurant?.image_url) {
    return { uri: restaurant.cover_image_url ?? restaurant.image_url };
  }
  return null;
}

function getDistanceText(restaurant) {
  const rawDistance = restaurant?.distance ?? restaurant?.distance_km;
  if (typeof rawDistance === "number") {
    return formatDistanceKm(rawDistance) ?? "Nearby";
  }
  if (rawDistance) {
    return String(rawDistance);
  }
  return "";
}

const RestaurantCard = ({ restaurant }) => {
  const router = useRouter();
  const title = restaurant?.title ?? restaurant?.name ?? "Restaurant";
  const reviews = restaurant?.reviews ?? restaurant?.reviews_count ?? 0;
  const cuisine = restaurant?.cuisine ?? restaurant?.category ?? "Dining";
  const type = restaurant?.type ?? "";
  const location =
    restaurant?.location ?? restaurant?.address ?? restaurant?.city ?? "Location unavailable";
  const imageSource = getImageSource(restaurant);
  const distanceText = getDistanceText(restaurant);

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {restaurant.badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: restaurant.badgeColor || "#ef4444" },
            ]}
          >
            <Text style={styles.badgeText}>{restaurant.badge}</Text>
          </View>
        )}
        {restaurant.profile_image_url ? (
          <View style={styles.profileImageWrap}>
            <Image source={{ uri: restaurant.profile_image_url }} style={styles.profileImage} />
          </View>
        ) : null}
        <View style={styles.ratingBadge}><Ionicons name="star" size={14} color="#f59e0b" /><Text style={styles.ratingBadgeText}>{restaurant.rating ?? restaurant.avg_rating ?? "4.5"}</Text></View>
        <View style={styles.saveOverlay}><SaveButton entityType="restaurant" entityId={restaurant.id} compact /></View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          style={styles.ratingRow}
          onPress={() => {
            router.push({
              pathname: `/home/reviews/${restaurant.id}`,
              params: { title: `${title} Reviews`, providerType: "restaurant" },
            });
          }}
        >
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.ratingText}>{restaurant.rating ?? restaurant.avg_rating ?? "4.5"}</Text>
          <Text style={styles.reviewText}>({reviews})</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.infoText}>
            {cuisine}
            {type ? ` • ${type}` : ""}
          </Text>
        </TouchableOpacity>
        <View style={styles.locationRow}>
          <Ionicons
            name="location"
            size={16}
            color={theme.COLORS.textSecondary}
          />
          <Text style={styles.locationText}>
            {[distanceText, location].filter(Boolean).join(" • ")}
          </Text>
        </View>
        <Button
          title="Book Now"
          onPress={() => router.push(`/home/dining/${restaurant.id}`)}
          style={styles.bookBtn}
          textStyle={styles.bookBtnText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  saveOverlay: { position: "absolute", top: 12, right: 12 },
  ratingBadge: { position: "absolute", top: 68, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7e8", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  ratingBadgeText: { fontSize: 13, fontWeight: "800", color: "#92400e" },
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
  },
  imageContainer: {
    height: 200,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: theme.COLORS.surface,
  },
  profileImageWrap: {
    position: "absolute",
    right: 14,
    bottom: 12,
    width: 58,
    height: 58,
    padding: 2,
    borderRadius: 20,
    backgroundColor: theme.COLORS.white,
    ...theme.SHADOWS.card,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
  },
  badge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: theme.COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 6,
    color: theme.COLORS.textSecondary,
  },
  infoText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  bookBtn: {
    height: 52,
    borderRadius: 16,
  },
  bookBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
});

export default RestaurantCard;


