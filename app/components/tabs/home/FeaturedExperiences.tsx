// @ts-nocheck
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";
import Button from "../../ui/Button";
import SaveButton from "../../ui/SaveButton";
import { formatDistanceKm } from "../../../lib/distance";
import { calculateDistanceKm } from "../../../lib/distance";
import { useHomeFeedQuery, useTrendingQuery, dedupeFeedItems } from "../../../lib/queries/homeQueries";
import { useAppSelector } from "../../../store/hooks";

function normalizeItems(payload) {
  const items = payload?.featured_experiences;
  return Array.isArray(items) ? dedupeFeedItems(items) : [];
}

function normalizeFallbackItems(payload) {
  const items = Array.isArray(payload) ? payload : payload?.items;
  return Array.isArray(items) ? dedupeFeedItems(items) : [];
}

function typeLabel(item) {
  const type = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "experience").toLowerCase();
  if (type === "restaurant" || type === "dining") return "Dining experience";
  if (type === "hotel") return "Stay experience";
  if (type === "spa") return "Wellness experience";
  if (type === "event") return "Event experience";
  if (type === "happy_hour" || type === "happy hour") return "Happy Hour experience";
  return "Recommended experience";
}

function typeIcon(item) {
  const type = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "").toLowerCase();
  if (type === "restaurant" || type === "dining") return "restaurant";
  if (type === "event") return "calendar";
  if (type === "spa") return "leaf";
  if (type === "hotel") return "bed";
  return "sparkles-outline";
}

function cardImage(item) {
  const type = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "").toLowerCase();
  if (type === "event") {
    return [item?.banner_image_url, item?.event_banner_image_url, item?.banner_url]
      .find((value) => typeof value === "string" && value.trim());
  }

  return [item?.profile_image_url, item?.cover_image_url, item?.image_url, item?.image]
    .find((value) => typeof value === "string" && value.trim());
}

function routeFor(item) {
  if (item.detail_route) return item.detail_route;
  const id = item.id ?? item._id;
  const category = String(item.service_type ?? item.entity_type ?? item.category ?? "").toLowerCase();
  if (category === "hotel") return `/home/hotels/${id}`;
  if (category === "spa") return `/home/spa/${id}`;
  if (category === "event") return `/home/events/${id}`;
  return `/home/dining/${id}`;
}

const FeaturedExperiences = () => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useHomeFeedQuery();
  const trendingQuery = useTrendingQuery(12);
  const coords = useAppSelector((state) => state.location.coords);
  const items = useMemo(() => {
    const featured = normalizeItems(data);
    const source = featured.length ? featured : normalizeFallbackItems(trendingQuery.data);
    return source.map((item) => {
    const distanceKm = calculateDistanceKm(coords, item);
    return distanceKm == null ? item : { ...item, distance_km: distanceKm };
    });
  }, [data, trendingQuery.data, coords]);

  if (isLoading || (trendingQuery.isLoading && !normalizeItems(data).length)) {
    return <ActivityIndicator style={styles.loading} color={theme.COLORS.primary} />;
  }

  if (isError && !items.length) {
    return <TouchableOpacity style={styles.status} onPress={() => refetch()}>
      <Text style={styles.statusText}>Featured experiences are unavailable. Tap to retry.</Text>
    </TouchableOpacity>;
  }

  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Featured Experiences</Text>
      <Text style={styles.sectionSubtitle}>Curated from the best nearby places</Text>
      <View style={styles.list}>
        {items.map((item, index) => {
          const id = item.id ?? item._id;
          const title = item.name ?? item.title ?? item.business_name;
          const route = routeFor(item);
          const image = cardImage(item);
          return (
          <TouchableOpacity key={`${String(item.service_type ?? item.entity_type ?? item.category ?? "experience")}-${id}-${index}`} style={styles.card} activeOpacity={0.9} onPress={() => router.push(route)}>
              {image ? <Image source={{ uri: image }} style={styles.image} /> : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name={typeIcon(item)} size={34} color={theme.COLORS.border} />
                </View>
              )}
              {item.avg_rating != null && <View style={styles.imageRatingBadge}><Ionicons name="star" size={14} color="#f59e0b" /><Text style={styles.imageRatingText}>{Number(item.avg_rating).toFixed(1)}</Text></View>}
              <View style={styles.cardContent}>
                <View style={styles.cardMetaRow}><View style={styles.typePill}><Ionicons name={typeIcon(item)} size={12} color={theme.COLORS.primary} /><Text style={styles.typeText}>{typeLabel(item)}</Text></View></View>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <View style={styles.detailsRow}>
                  {item.avg_rating != null && <>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.ratingText}>{Number(item.avg_rating).toFixed(1)}</Text>
                    <Text style={styles.separator}>•</Text>
                  </>}
                  <Text style={styles.distance}>{formatDistanceKm(item.distance_km) ?? "Nearby"}</Text>
                </View>
                <View style={styles.actionRow}>
                  <Button title={String(item.category ?? "Explore").toLowerCase() === "hotel" ? "Book Stay" : "Explore"} onPress={() => router.push(route)} style={styles.actionBtn} textStyle={styles.actionBtnText} />
                  <SaveButton entityType={String(item.service_type ?? item.entity_type ?? item.category ?? "restaurant").toLowerCase().replace("dining", "restaurant")} entityId={id} compact />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loading: { marginTop: 30 },
  container: { paddingHorizontal: 20, marginTop: 30, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: theme.COLORS.textPrimary, marginBottom: 3 },
  sectionSubtitle: { fontSize: 13, color: theme.COLORS.textSecondary, marginBottom: 16 },
  list: { gap: 16 },
  card: { flexDirection: "row", backgroundColor: theme.COLORS.white, borderRadius: 24, borderWidth: 1, borderColor: theme.COLORS.border, padding: 12, alignItems: "center", ...theme.SHADOWS.card },
  image: { width: 100, height: 100, borderRadius: 16 },
  imagePlaceholder: { backgroundColor: theme.COLORS.surface, justifyContent: "center", alignItems: "center" },
  imageRatingBadge: { position: "absolute", top: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff7e8", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  imageRatingText: { fontSize: 13, fontWeight: "800", color: "#92400e" },
  cardContent: { flex: 1, marginLeft: 16, justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", color: theme.COLORS.textPrimary, marginBottom: 6 },
  detailsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12 },
  ratingText: { fontSize: 14, fontWeight: "700", color: theme.COLORS.textPrimary },
  separator: { color: theme.COLORS.textSecondary },
  distance: { fontSize: 13, color: theme.COLORS.textSecondary },
  status: { marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: theme.COLORS.surface },
  statusText: { textAlign: "center", color: theme.COLORS.textSecondary, fontSize: 13 },
  actionBtn: { height: 36, borderRadius: 8, width: 110, paddingHorizontal: 12 },
  actionBtnText: { fontSize: 14 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  typePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 7, borderRadius: 999, backgroundColor: "#eef2ff" },
  cardMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  typeText: { color: theme.COLORS.primary, fontSize: 10, fontWeight: "800" },
});

export default FeaturedExperiences;
