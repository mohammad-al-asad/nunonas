// @ts-nocheck
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import theme from "../../constants/theme";
import { reverseGeocode } from "../../lib/google-maps";
import { getCurrentCoords, isExpectedLocationError } from "../../lib/location";
import { clearRecentSearches, globalSearch, listCategories, listRecentSearches } from "../../lib/customer-api";

// Import Components
import CategoryCard from "../../components/tabs/search/CategoryCard";
import RecentSearchItem from "../../components/tabs/search/RecentSearchItem";

const CATEGORY_DEFINITIONS = [
  {
    id: "restaurants",
    title: "Restaurants",
    route: "/home/dining",
    count: "Loading...",
    iconName: "restaurant",
    iconColor: "#ef4444",
    iconBgColor: "#fef2f2",
  },
  {
    id: "events",
    title: "Events",
    route: "/home/events",
    count: "Loading...",
    iconName: "calendar",
    iconColor: "#a855f7",
    iconBgColor: "#f5f3ff",
  },
  {
    id: "spas",
    title: "Spas",
    route: "/home/spa",
    count: "Loading...",
    iconName: "leaf",
    iconColor: "#ec4899",
    iconBgColor: "#fdf2f7",
  },
  {
    id: "hotels",
    title: "Hotels",
    route: "/home/hotels",
    count: "Loading...",
    iconName: "bed",
    iconColor: "#3b82f6",
    iconBgColor: "#eff6ff",
  },
];

const INITIAL_RECENT_SEARCHES = [];

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => String(q ?? ""));
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);
  const [categories, setCategories] = useState(() =>
    CATEGORY_DEFINITIONS.map((category) => ({ ...category })),
  );
  const [currentLocation, setCurrentLocation] = useState("Location unavailable");

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listRecentSearches(), listCategories()])
      .then(([recent, categoryResponse]) => {
        if (!active) return;
        const recentItems = recent?.items ?? recent?.data ?? recent ?? [];
        setRecentSearches(Array.isArray(recentItems) ? recentItems.map((item) => item.query ?? item.text ?? item).filter(Boolean) : []);
        const categoryItems = categoryResponse?.items ?? categoryResponse?.data ?? [];
        const counts = new Map(
          (Array.isArray(categoryItems) ? categoryItems : []).map((item) => [
            String(item.key ?? "").toLowerCase(),
            Number(item.count ?? 0),
          ]),
        );
        setCategories((current) =>
          current.map((category) => ({
            ...category,
            count: `${counts.get(category.id.replace(/s$/, "")) ?? 0} places`,
          })),
        );
      })
      .catch(() => {
        if (active) setRecentSearches([]);
      });
    return () => {
      active = false;
    };
  }, []));

  useEffect(() => {
    async function getUserLocation() {
      try {
        const coords = await getCurrentCoords();
        if (!coords) return;

        const address = await reverseGeocode(
          coords.latitude,
          coords.longitude
        );
        if (address) {
          setCurrentLocation(address);
        }
      } catch (error) {
        if (!isExpectedLocationError(error)) {
          console.warn("Could not retrieve current location in search: ", error);
        }
      }
    }

    getUserLocation();
  }, []);

  const handleRemoveSearch = (index) => {
    const newSearches = [...recentSearches];
    newSearches.splice(index, 1);
    setRecentSearches(newSearches);
  };

  const handleClearAll = () => {
    void clearRecentSearches().finally(() => setRecentSearches([]));
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearching(true);
    try {
      const response = await globalSearch(query, { limit: 20 });
      const items = response?.items ?? response?.data ?? response ?? [];
      setResults(Array.isArray(items) ? items : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={theme.COLORS.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, events, spas, hotels..."
            placeholderTextColor={theme.COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searching ? <Text style={styles.searchStatus}>Searching nearby...</Text> : null}
        {!searching && searchQuery.trim() && results.length === 0 ? <Text style={styles.searchStatus}>No matching places found.</Text> : null}
        {results.length > 0 ? <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Search results</Text>
          {results.map((item, index) => {
            const type = String(item.entity_type ?? item.service_type ?? item.category ?? "restaurant").toLowerCase();
            const id = String(item.id ?? item._id ?? index);
            const route = type === "hotel" ? `/home/hotels/${id}` : type === "spa" ? `/home/spa/${id}` : type === "event" ? `/home/events/${id}` : `/home/dining/${id}`;
            return <TouchableOpacity key={`${type}-${id}`} style={styles.resultCard} onPress={() => router.push(route)}>
              <Ionicons name={type === "hotel" ? "bed-outline" : type === "spa" ? "sparkles-outline" : type === "event" ? "calendar-outline" : "restaurant-outline"} size={20} color={theme.COLORS.primary} />
              <View style={styles.resultBody}><Text style={styles.resultTitle} numberOfLines={1}>{item.name ?? item.title ?? item.business_name ?? "Place"}</Text><Text style={styles.resultMeta}>{type.replace("_", " ")} {item.location ? `· ${item.location}` : ""}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.COLORS.textSecondary} />
            </TouchableOpacity>;
          })}
        </View> : null}
        {!searchQuery.trim() ? <>
        {/* Current Location Card */}
        <TouchableOpacity
          style={styles.locationCard} 
          activeOpacity={0.8}
          onPress={() => router.push("/map")}
        >
          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <Ionicons
                name="location"
                size={20}
                color={theme.COLORS.secondary}
              />
              <Text style={styles.locationLabel}>Current Location</Text>
            </View>
            <Text style={styles.locationText} numberOfLines={1}>{currentLocation}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.COLORS.white}
            />
          </View>
        </TouchableOpacity>

        {/* Browse by Category */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              count={category.count}
              iconName={category.iconName}
              iconColor={category.iconColor}
              iconBgColor={category.iconBgColor}
              onPress={() => router.push(category.route)}
            />
          ))}
        </View>
        </> : null}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentList}>
              {recentSearches.map((query, index) => (
                <RecentSearchItem
                  key={index}
                  title={query}
                  onRemove={() => handleRemoveSearch(index)}
                />
              ))}
            </View>
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
  searchHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchStatus: {
    marginBottom: 18,
    color: theme.COLORS.textSecondary,
    fontSize: 13,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
  },
  resultBody: { flex: 1 },
  resultTitle: { color: theme.COLORS.textPrimary, fontSize: 14, fontWeight: "800" },
  resultMeta: { marginTop: 4, color: theme.COLORS.textSecondary, fontSize: 12, textTransform: "capitalize" },
  locationCard: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    ...theme.SHADOWS.primary,
  },
  locationInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  locationLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  locationText: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.COLORS.white,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  recentSection: {
    marginTop: 8,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textLink,
  },
  recentList: {
    marginTop: 8,
  },
});


