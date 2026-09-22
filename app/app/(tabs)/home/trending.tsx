// @ts-nocheck
import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../constants/theme";
import Button from "../../../components/ui/Button";
import { useTrendingQuery, dedupeFeedItems } from "../../../lib/queries/homeQueries";
import { useAppSelector } from "../../../store/hooks";
import { calculateDistanceKm, formatDistanceKm } from "../../../lib/distance";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "restaurant", label: "Restaurants" },
  { key: "hotel", label: "Hotels" },
  { key: "spa", label: "Spas" },
  { key: "event", label: "Events" },
  { key: "happy_hour", label: "Happy Hours" },
];

function typeOf(item) {
  const value = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "hotel").toLowerCase();
  if (value === "restaurant" || value === "dining") return "Restaurant";
  if (value === "spa") return "Spa";
  if (value === "event") return "Event";
  if (value === "happy_hour" || value === "happy hour") return "Happy Hour";
  return "Hotel";
}

function iconFor(item) {
  const type = typeOf(item);
  if (type === "Restaurant") return "restaurant-outline";
  if (type === "Spa") return "sparkles-outline";
  if (type === "Event") return "calendar-outline";
  if (type === "Happy Hour") return "pricetag-outline";
  return "bed-outline";
}

function routeFor(item) {
  if (item.detail_route) return item.detail_route;
  const id = item.id ?? item._id;
  const type = typeOf(item);
  if (type === "Hotel") return `/home/hotels/${id}`;
  if (type === "Spa") return `/home/spa/${id}`;
  if (type === "Event") return `/home/events/${id}`;
  if (type === "Happy Hour") return `/home/dining/${item.vendor_id ?? id}`;
  return `/home/dining/${id}`;
}

export default function TrendingScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = React.useState("all");
  const coords = useAppSelector((state) => state.location.coords);
  const { data, isLoading, isError, refetch } = useTrendingQuery(50);
  const items = useMemo(() => {
    const raw = Array.isArray(data) ? data : data?.items ?? [];
    return dedupeFeedItems(raw).map((item) => {
      const distance = calculateDistanceKm(coords, item);
      return distance == null ? item : { ...item, distance_km: distance };
    });
  }, [data, coords]);
  const availableFilters = useMemo(() => {
    const available = new Set(items.map((item) => {
      const type = String(item.service_type ?? item.entity_type ?? item.category ?? "hotel").toLowerCase();
      return type === "dining" ? "restaurant" : type;
    }));
    return FILTERS.filter((filter) => filter.key === "all" || available.has(filter.key));
  }, [items]);
  const filteredItems = activeFilter === "all" ? items : items.filter((item) => {
    const type = String(item.service_type ?? item.entity_type ?? item.category ?? "hotel").toLowerCase();
    return (type === "dining" ? "restaurant" : type) === activeFilter;
  });

  if (isLoading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={theme.COLORS.primary} /></SafeAreaView>;
  if (isError) return <SafeAreaView style={styles.center}><Text style={styles.emptyText}>Trending places could not be loaded.</Text><Button title="Try again" onPress={() => refetch()} style={styles.retry} /></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={theme.COLORS.textPrimary} /></TouchableOpacity><View style={styles.headerText}><Text style={styles.title}>Trending Now</Text><Text style={styles.subtitle}>Popular nearby across every Nuno category</Text></View></View>
    {!items.length ? <View style={styles.center}><Ionicons name="trending-up-outline" size={38} color={theme.COLORS.textSecondary} /><Text style={styles.emptyTitle}>Nothing trending nearby yet</Text><Text style={styles.emptyText}>Published restaurants, hotels, spas, events, and Happy Hours will appear here.</Text></View> : <FlatList data={filteredItems} keyExtractor={(item, index) => `${typeOf(item).toLowerCase()}-${item.id ?? item._id ?? index}`} contentContainerStyle={styles.list} ListHeaderComponent={<View style={styles.filterSection}><Text style={styles.filterTitle}>Trending categories</Text><FlatList horizontal data={availableFilters} showsHorizontalScrollIndicator={false} keyExtractor={(filter) => filter.key} contentContainerStyle={styles.filters} renderItem={({ item: filter }) => <TouchableOpacity style={[styles.filter, activeFilter === filter.key && styles.filterActive]} onPress={() => setActiveFilter(filter.key)}><Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>{filter.label}</Text></TouchableOpacity>} /></View>} ListEmptyComponent={<View style={styles.filteredEmpty}><Text style={styles.emptyText}>No trending {activeFilter.replace("_", " ")} places nearby.</Text></View>} renderItem={({ item }) => {
      const image = item.profile_image_url ?? item.cover_image_url ?? item.image_url ?? item.image;
      const title = item.name ?? item.title ?? item.business_name ?? "Trending place";
      return <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => router.push(routeFor(item))}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]}><Ionicons name={iconFor(item)} size={30} color={theme.COLORS.border} /></View>}
        <View style={styles.body}><View style={styles.pill}><Ionicons name={iconFor(item)} size={13} color={theme.COLORS.primary} /><Text style={styles.pillText}>{typeOf(item)}</Text></View><Text style={styles.cardTitle} numberOfLines={1}>{title}</Text><View style={styles.meta}><Ionicons name="star" size={14} color="#f59e0b" /><Text style={styles.metaText}>{item.avg_rating != null ? Number(item.avg_rating).toFixed(1) : "New"}</Text><Text style={styles.dot}>·</Text><Text style={styles.metaText}>{formatDistanceKm(item.distance_km) ?? "Nearby"}</Text></View><Text style={styles.location} numberOfLines={1}>{item.location ?? item.address ?? "Nearby"}</Text><Button title="View details" onPress={() => router.push(routeFor(item))} style={styles.button} textStyle={styles.buttonText} /></View>
      </TouchableOpacity>;
    }} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: theme.COLORS.white }, header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.COLORS.border }, headerText: { flex: 1 }, title: { color: theme.COLORS.textPrimary, fontSize: 24, fontWeight: "800" }, subtitle: { color: theme.COLORS.textSecondary, fontSize: 13, marginTop: 4 }, list: { padding: 20, gap: 14 }, filterSection: { marginBottom: 8 }, filterTitle: { color: theme.COLORS.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 10 }, filters: { gap: 8 }, filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: theme.COLORS.border, backgroundColor: theme.COLORS.white }, filterActive: { backgroundColor: theme.COLORS.primary, borderColor: theme.COLORS.primary }, filterText: { color: theme.COLORS.textPrimary, fontSize: 12, fontWeight: "700" }, filterTextActive: { color: theme.COLORS.white }, filteredEmpty: { padding: 28, alignItems: "center" }, card: { flexDirection: "row", padding: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.COLORS.border, backgroundColor: theme.COLORS.white, ...theme.SHADOWS.card }, image: { width: 112, height: 150, borderRadius: 16 }, placeholder: { backgroundColor: theme.COLORS.surface, alignItems: "center", justifyContent: "center" }, body: { flex: 1, paddingLeft: 14, justifyContent: "center" }, pill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: "#eef2ff" }, pillText: { color: theme.COLORS.primary, fontSize: 11, fontWeight: "800" }, cardTitle: { color: theme.COLORS.textPrimary, fontSize: 17, fontWeight: "800", marginTop: 9 }, meta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }, metaText: { color: theme.COLORS.textSecondary, fontSize: 12, fontWeight: "700" }, dot: { color: theme.COLORS.textSecondary }, location: { color: theme.COLORS.textSecondary, fontSize: 12, marginTop: 7 }, button: { height: 34, borderRadius: 10, marginTop: 12, width: 116 }, buttonText: { fontSize: 12 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }, emptyTitle: { color: theme.COLORS.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 12 }, emptyText: { color: theme.COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 19 }, retry: { marginTop: 16, width: 120 },
});
