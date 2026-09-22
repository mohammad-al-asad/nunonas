// @ts-nocheck
import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import SaveButton from "../../../ui/SaveButton";

const HotelCard = ({ hotel }) => {
  const router = useRouter();

  const getAmenityIcon = (name) => {
    switch (name.toLowerCase()) {
      case "wifi":
        return "wifi";
      case "pool":
        return "pool";
      case "breakfast":
        return "coffee";
      case "gym":
        return "dumbbell";
      case "parking":
        return "car";
      case "metro":
        return "train";
      case "safe":
        return "shield-check";
      case "kids club":
        return "baby-face-outline";
      case "restaurant":
        return "silverware-fork-knife";
      default:
        return "star";
    }
  };

  const hotelImageUrl = typeof hotel.image === "string" ? hotel.image.trim() : "";
  const imageSource = hotelImageUrl
    ? { uri: hotelImageUrl }
    : hotel.image && typeof hotel.image === "object"
      ? hotel.image
      : null;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push(`/home/hotels/${hotel.id}`)}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="bed" size={42} color={theme.COLORS.textSecondary} />
          </View>
        )}
        {hotel.badge && (
          <View style={[styles.badge, { backgroundColor: "#06b6d4" }]}>
            <Text style={styles.badgeText}>{hotel.badge}</Text>
          </View>
        )}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                hotel.status === "Available" ? "#22c55e" : "#f97316",
            },
          ]}
        >
          <Text style={styles.statusText}>{hotel.status}</Text>
        </View>
        <View style={styles.favoriteBtn}><SaveButton entityType="hotel" entityId={hotel.id} compact /></View>
        <View style={styles.ratingBadge}><Ionicons name="star" size={14} color="#f59e0b" /><Text style={styles.ratingBadgeText}>{Number(hotel.rating ?? 0).toFixed(1)}</Text></View>
        {hotel.profile_image_url ? (
          <View style={styles.profileImageWrap}>
            <Image source={{ uri: hotel.profile_image_url }} style={styles.profileImage} />
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{hotel.title}</Text>
          <TouchableOpacity
            style={styles.ratingBox}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: `/home/reviews/${hotel.id}`,
                params: { title: `${hotel.title} Reviews`, providerType: "hotel" },
              });
            }}
          >
            <Ionicons name="star" size={14} color="#facc15" />
            <Text style={styles.reviewsText}>{Number(hotel.rating ?? 0).toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({hotel.reviews} reviews)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={theme.COLORS.primary} />
          <Text style={styles.locationText}>{hotel.location}</Text>
        </View>

        <View style={styles.amenities}>
          {hotel.amenities.map((item, index) => (
            <View key={index} style={styles.amenityItem}>
              <MaterialCommunityIcons
                name={getAmenityIcon(item)}
                size={14}
                color={theme.COLORS.textSecondary}
              />
              <Text style={styles.amenityText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${hotel.price}</Text>
            <Text style={styles.perNight}>/night</Text>
          </View>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/home/hotels/${hotel.id}`)}
          >
            <Text style={styles.viewBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ratingBadge: { position: "absolute", top: 68, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7e8", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  ratingBadgeText: { fontSize: 13, fontWeight: "800", color: "#92400e" },
  container: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  imageContainer: {
    height: 200,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    backgroundColor: theme.COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
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
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 50, // To give space for heart
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  favoriteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    padding: 16,
  },
  titleRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewsText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  amenities: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  amenityText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  perNight: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginLeft: 2,
  },
  viewBtn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default HotelCard;


