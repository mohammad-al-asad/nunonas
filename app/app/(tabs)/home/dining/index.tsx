import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DiningFilters from "../../../../components/tabs/home/dining/DiningFilters";
import DiningSearch from "../../../../components/tabs/home/dining/DiningSearch";
import DiningViewToggle, {
  type DiningView,
} from "../../../../components/tabs/home/dining/DiningViewToggle";
import RestaurantCard from "../../../../components/tabs/home/dining/RestaurantCard";
import RestaurantMap from "../../../../components/tabs/home/dining/RestaurantMap";
import MapFilterChips, {
  toggleMapFilter,
  type MapFilterKey,
} from "../../../../components/ui/MapFilterChips";
import theme from "../../../../constants/theme";
import { listRestaurants } from "../../../../lib/customer-api";
import type {
  ProviderCollectionResponse,
  ProviderPayload,
} from "../../../../lib/provider-types";

type RestaurantResponse =
  | ProviderCollectionResponse<ProviderPayload>
  | ProviderPayload[];

export default function DiningScreen() {
  const [restaurants, setRestaurants] = useState<ProviderPayload[]>([]);
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<DiningView>("list");
  const [mapFilters, setMapFilters] = useState<MapFilterKey[]>(["near-me"]);

  const fetchRestaurants = useCallback(async () => {
    try {
      setError("");
      const mapMode = view === "map";
      const response = await listRestaurants<RestaurantResponse>({
        limit: 100,
        skip: 0,
        // List mode shows the complete searchable catalogue. Map mode applies
        // map-only filters after foreground location permission is granted.
        nearby: false,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(mapMode && mapFilters.includes("open-now") ? { open_now: true } : {}),
        ...(mapMode && mapFilters.includes("top-rated") ? { top_rated: true } : {}),
        ...(mapMode && mapFilters.includes("offers") ? { offers: true } : {}),
      });
      const items = Array.isArray(response) ? response : response.items ?? [];
      setRestaurants(items);
      setRestaurantCount(
        Array.isArray(response)
          ? response.length
          : Number(response.total ?? items.length),
      );
    } catch (requestError: unknown) {
      console.warn("Failed to load restaurants:", requestError);
      setRestaurants([]);
      setRestaurantCount(0);
      setError("Restaurants could not be loaded. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mapFilters, searchQuery, view]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void fetchRestaurants();
    }, searchQuery ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchRestaurants, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchRestaurants();
  };

  return (
    <SafeAreaView style={styles.container}>
      <DiningSearch
        value={searchQuery}
        onSearch={setSearchQuery}
        mapMode={view === "map"}
      />
      {view === "map" ? (
        <View style={styles.mapFilters}>
          <MapFilterChips
            active={mapFilters}
            locked={["near-me"]}
            onToggle={(filter) =>
              setMapFilters((current) => toggleMapFilter(current, filter))
            }
          />
        </View>
      ) : null}
      <DiningViewToggle
        count={restaurantCount}
        view={view}
        onChange={setView}
      />

      {view === "map" ? (
        <View style={styles.mapContainer}>
          <RestaurantMap
            restaurants={restaurants}
            loading={loading}
            activeFilters={mapFilters}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <DiningFilters />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Could not load restaurants</Text>
              <Text style={styles.emptySubtext}>{error}</Text>
            </View>
          ) : restaurants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No restaurants found</Text>
              <Text style={styles.emptySubtext}>
                Try another restaurant name, area, or filter.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={String(restaurant.id ?? restaurant._id)}
                  restaurant={restaurant}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  listScroll: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    minHeight: 420,
    marginTop: 14,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
  },
  mapFilters: {
    marginTop: 12,
  },
  list: {
    marginTop: 5,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  emptyText: {
    marginBottom: 8,
    color: theme.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtext: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
