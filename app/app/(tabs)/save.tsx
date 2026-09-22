// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../constants/theme";
import { listSaved, removeSaved } from "../../lib/customer-api";
import { showToast } from "../../lib/toast";
import { useAppDispatch } from "../../store/hooks";
import { hydrateSavedItems, markUnsaved } from "../../store/slices/savedSlice";


// Import Components
import SavedCard from "../../components/tabs/save/SavedCard";

const FILTERS = ["All", "Restaurants", "Events", "Spas", "Hotels", "Happy Hours"];

const SAVED_ITEMS = [];
/* Legacy placeholder removed; saved cards are loaded from the customer API. */
/*
  {
    id: "1",
    title: "The Garden Bistro",
    type: "Restaurant",
    categoryIcon: "restaurant",
    rating: "4.8",
    subInfo: "Italian Cuisine",
    location: "Downtown",
    distance: "2.5 km",
    actionLabel: "Book Now",
    image: require("../../assets/images/discover-experience.png"),
  },
  {
    id: "2",
    title: "Summer Jazz Festival",
    type: "Event",
    categoryIcon: "calendar",
    rating: null,
    subInfo: "Jun 15, 2024 • 6:00 PM",
    location: "Central Park Arena",
    distance: "4.2 km",
    actionLabel: "Get Tickets",
    image: require("../../assets/images/events.webp"),
  },
  {
    id: "3",
    title: "Serenity Wellness Spa",
    type: "Spa",
    categoryIcon: "leaf",
    rating: "4.9",
    subInfo: "Massage & Therapy",
    location: "Wellness District",
    distance: "3.2 km",
    actionLabel: "Book Now",
    image: require("../../assets/images/spa/galley/Rectangle 2.png"),
  },
  {
    id: "4",
    title: "The Royal Plaza Hotel",
    type: "Hotel",
    categoryIcon: "bed",
    rating: "4.7",
    subInfo: "5-Star Luxury",
    location: "City Center",
    distance: "1.8 km",
    price: "$189",
    actionLabel: "Book Now",
    image: require("../../assets/images/hotel/hotel.jpg"),
  },
]; */

function normalizeSavedItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.saved_items)) {
    return payload.saved_items;
  }

  return [];
}

export default function SaveScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useAppDispatch();

  const fetchSaved = useCallback(async () => {
    try {
      const data = await listSaved();
      const items = normalizeSavedItems(data);
      setSavedItems(items);
      dispatch(hydrateSavedItems(items));
    } catch (err) {
      console.warn("Failed to load saved items:", err.message);
      setSavedItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const handleRemoveSaved = useCallback(async (entityType, entityId) => {
    try {
      await removeSaved(entityType, entityId);
      dispatch(markUnsaved({ entityType, entityId: String(entityId) }));
      setSavedItems((prev) => prev.filter((item) => (item.id ?? item._id) !== entityId));
      showToast("Removed from saved items.", { type: "success" });
    } catch (err) {
      console.warn("Failed to remove saved item:", err.message);
      showToast("Could not remove this saved item.", { type: "error" });
    }
  }, []);

  const normalizedSavedItems = normalizeSavedItems(savedItems).map((item) => ({
    ...item,
    type: item.type ?? item.entity_type ?? "Venue",
    title: item.title ?? item.name ?? "Saved item",
    categoryIcon: item.categoryIcon ?? (item.entity_type === "event" ? "calendar" : item.entity_type === "hotel" ? "bed" : item.entity_type === "spa" ? "leaf" : "restaurant"),
    rating: item.rating ?? item.avg_rating ?? null,
    subInfo: item.subInfo ?? item.category ?? "",
    location: item.location ?? item.address ?? "",
    distance: item.distance ?? (item.distance_km ? `${item.distance_km} km` : ""),
    image: item.entity_type === "event"
      ? item.banner_image_url ?? item.cover_image_url ?? item.image_url ?? item.image
      : item.image_url ?? item.cover_image_url ?? item.image,
    savedAt: item.saved_at ?? item.created_at ?? null,
    actionLabel: item.entity_type === "event" ? "Get Tickets" : "Book Now",
  }));

  const filteredItems =
    activeFilter === "All"
      ? normalizedSavedItems
      : normalizedSavedItems.filter((item) => {
          const type = (item.entity_type ?? item.type ?? "").toLowerCase();
          return type.includes(activeFilter.toLowerCase());
        });


  const renderFilterItem = ({ item }) => {
    const isActive = activeFilter === item;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(item)}
        activeOpacity={0.7}
      >
        {item !== "All" && (
          <Ionicons
            name={
              item === "Restaurants"
                ? "restaurant"
                : item === "Events"
                  ? "calendar"
                  : item === "Spas"
                    ? "leaf"
                    : item === "Happy Hours"
                      ? "pricetag-outline"
                      : "bed"
            }
            size={16}
            color={isActive ? theme.COLORS.white : theme.COLORS.textSecondary}
            style={styles.filterIcon}
          />
        )}
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Saved Items</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Horizontal List */}
      <View style={styles.filterContainer}>
        <FlatList
          data={FILTERS}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Saved Items List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSaved(); }} />
        }
      >
        {loading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.COLORS.primary} />
          </View>
        )}
        {Array.isArray(filteredItems) &&
          filteredItems.map((item, index) => (
          <SavedCard
            key={item.id ?? item._id ?? `${item.entity_type ?? item.type ?? "saved"}-${index}`}
            item={item}
            onDetails={() => router.push(`/home/${item.entity_type === "event" ? "events" : item.entity_type === "hotel" ? "hotels" : item.entity_type === "spa" ? "spa" : "dining"}/${item.entity_id ?? item.id}`)}
            onAction={() => router.push(`/home/${item.entity_type === "event" ? "events" : item.entity_type === "hotel" ? "hotels" : item.entity_type === "spa" ? "spa" : "dining"}/${item.entity_id ?? item.id}`)}
            onRemove={() => handleRemoveSaved(item.entity_type ?? item.type, item.entity_id ?? item.id)}
          />
        ))}

        {(!Array.isArray(filteredItems) || filteredItems.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons
              name="heart-dislike-outline"
              size={64}
              color={theme.COLORS.textSecondary}
              opacity={0.3}
            />
            <Text style={styles.emptyText}>
              No saved {activeFilter.toLowerCase()} yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  filterContainer: {
    marginVertical: 16,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  filterChipActive: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  filterTextActive: {
    color: theme.COLORS.white,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
});


