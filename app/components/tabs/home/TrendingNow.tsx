// @ts-nocheck
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";
import Button from "../../ui/Button";
import SaveButton from "../../ui/SaveButton";
import { calculateDistanceKm, formatDistanceKm } from "../../../lib/distance";
import { useTrendingQuery, dedupeFeedItems } from "../../../lib/queries/homeQueries";
import { useAppSelector } from "../../../store/hooks";

function getLocationLabel(item) {
  const rawLocation =
    item?.location_label ??
    item?.location ??
    item?.address ??
    item?.city;

  if (rawLocation == null) {
    return "";
  }

  return String(rawLocation).trim();
}

function normalizeTrendingItems(payload) {
  if (Array.isArray(payload)) {
    return dedupeFeedItems(payload).filter((item) => (item?.name ?? item?.title));
  }

  if (Array.isArray(payload?.items)) {
    return dedupeFeedItems(payload.items).filter((item) => (item?.name ?? item?.title));
  }

  return [];
}

function getDistanceLabel(item) {
  const rawDistance =
    item?.distance ??
    item?.distance_km ??
    item?.proximity_km ??
    item?.nearby_distance ??
    item?.area;

  if (rawDistance == null || rawDistance === "") {
    return "Nearby";
  }

  if (typeof rawDistance === "number") {
    return formatDistanceKm(rawDistance) ?? "Nearby";
  }

  const normalized = String(rawDistance).trim();
  if (!normalized) {
    return "Nearby";
  }

  if (normalized.toLowerCase().includes("km")) {
    return normalized.toLowerCase().includes("away") ? normalized : `${normalized} away`;
  }

  return normalized;
}


function getItemType(item) {
  const type = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "").toLowerCase();
  if (type === "restaurant" || type === "dining") return "Restaurant";
  if (type === "spa") return "Spa";
  if (type === "event") return "Event";
  if (type === "happy_hour" || type === "happy hour") return "Happy Hour";
  return "Hotel";
}

function getTypeIcon(item) {
  const type = getItemType(item);
  if (type === "Restaurant") return "restaurant";
  if (type === "Spa") return "leaf";
  if (type === "Event") return "calendar";
  if (type === "Happy Hour") return "pricetag-outline";
  return "bed";
}

function getCardImage(item) {
  const type = getItemType(item);
  if (type === "Event") {
    return [item?.banner_image_url, item?.event_banner_image_url, item?.banner_url]
      .find((value) => typeof value === "string" && value.trim());
  }

  return [item?.profile_image_url, item?.cover_image_url, item?.image_url, item?.image]
    .find((value) => typeof value === "string" && value.trim());
}

function getDetailRoute(item) {
  if (item?.detail_route) {
    return item.detail_route;
  }

  const itemId = item?.id ?? item?._id;
  const type = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "").toLowerCase();
  if (type === "hotel") return `/home/hotels/${itemId}`;
  if (type === "spa") return `/home/spa/${itemId}`;
  if (type === "event") return `/home/events/${itemId}`;
  if (type === "happy_hour" || type === "happy hour") {
    const venueType = String(item?.venue_type ?? "restaurant").toLowerCase();
    if (venueType === "hotel") return `/home/hotels/${item?.vendor_id ?? itemId}`;
    if (venueType === "spa") return `/home/spa/${item?.vendor_id ?? itemId}`;
  }
  return `/home/dining/${itemId}`;
}

const TrendingNow = () => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useTrendingQuery(12);
  const coords = useAppSelector((state) => state.location.coords);
  const items = useMemo(() => normalizeTrendingItems(data).map((item) => {
    const distanceKm = calculateDistanceKm(coords, item);
    return distanceKm == null ? item : { ...item, distance_km: distanceKm };
  }), [data, coords]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.COLORS.primary} />
      </View>
    );
  }

  if (isError) {
    return <TouchableOpacity style={styles.errorState} onPress={() => refetch()}>
      <Text style={styles.emptyText}>Trending is unavailable. Tap to retry.</Text>
    </TouchableOpacity>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <TouchableOpacity onPress={() => router.push("/home/trending")}>
          <Text style={styles.viewAll}>Explore All</Text>
        </TouchableOpacity>
      </View>

      {items.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item, index) => {
            const itemId = item.id ?? item._id ?? `trending-${index}`;
            const itemKey = `${getItemType(item).toLowerCase()}-${itemId}-${index}`;
            const title = item.name ?? item.title;
            const detailRoute = getDetailRoute(item);
            const imageUrl = getCardImage(item);

            return (
              <View key={itemKey} style={styles.cardShadow}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(detailRoute)}
                  activeOpacity={0.9}
                >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                  />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name={getTypeIcon(item)} size={42} color={theme.COLORS.border} />
                  </View>
                )}
                {item.avg_rating != null && <View style={styles.imageRatingBadge}><Ionicons name="star" size={14} color="#f59e0b" /><Text style={styles.imageRatingText}>{Number(item.avg_rating).toFixed(1)}</Text></View>}
                <View style={styles.cardContent}>
                  <View style={styles.cardMetaRow}><View style={styles.typePill}><Ionicons name={getTypeIcon(item)} size={13} color={theme.COLORS.primary} /><Text style={styles.typeText}>{getItemType(item)}</Text></View><SaveButton entityType={getItemType(item).toLowerCase().replace(" ", "_")} entityId={itemId} compact /></View>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {title}
                    </Text>

                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={18} color="#9ca3af" />
                    <Text style={styles.distance}>{getDistanceLabel(item)}</Text>
                  </View>

                  {!!getLocationLabel(item) && (
                    <Text style={styles.locationText} numberOfLines={1}>
                      {getLocationLabel(item)}
                    </Text>
                  )}

                  <Button
                    title="Book Now"
                    onPress={() => router.push(detailRoute)}
                    style={styles.bookBtn}
                    textStyle={styles.bookBtnText}
                  />
                </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bed-outline" size={28} color={theme.COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No trending places right now</Text>
          <Text style={styles.emptyText}>
            Hotels, restaurants, spas, and events will appear here based on what is popular nearby.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  container: {
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textLink,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  emptyState: {
    marginHorizontal: 20,
    minHeight: 120,
    borderRadius: 24,
    backgroundColor: theme.COLORS.surface,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  card: {
    width: 320,
    backgroundColor: theme.COLORS.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#f1f3f7",
    overflow: "hidden",
  },
  cardShadow: {
    width: 320,
    marginRight: 18,
    borderRadius: 30,
  },
  image: {
    width: "100%",
    height: 220,
  },
  imagePlaceholder: {
    backgroundColor: theme.COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  imageRatingBadge: { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7e8", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  imageRatingText: { fontSize: 13, fontWeight: "800", color: "#92400e" },
  errorState: { marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: theme.COLORS.surface },
  providerImage: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#ffffff",
    backgroundColor: "#e2e8f0",
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  typePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, borderRadius: 999, backgroundColor: "#eef2ff" },
  cardMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  typeText: { fontSize: 12, fontWeight: "800", color: theme.COLORS.primary },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7e8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#b45309",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  distance: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  locationText: {
    marginTop: -12,
    marginBottom: 18,
    fontSize: 14,
    color: "#8b95a7",
  },
  bookBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#29439a",
  },
  bookBtnText: {
    fontSize: 17,
    fontWeight: "800",
  },
});

export default TrendingNow;


