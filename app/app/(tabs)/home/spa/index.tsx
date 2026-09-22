// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../../constants/theme";

// Import Spa Components
import SpaSearch from "../../../../components/tabs/home/spa/SpaSearch";
import SpaViewToggle from "../../../../components/tabs/home/spa/SpaViewToggle";
import SpaFilters from "../../../../components/tabs/home/spa/SpaFilters";
import SpaCard from "../../../../components/tabs/home/spa/SpaCard";
import CategoryMap from "../../../../components/tabs/home/CategoryMap";
import { listSpas } from "../../../../lib/customer-api";
import { normalizeSpa, getErrorMessage } from "../../../../lib/provider-utils";
import MapFilterChips, { toggleMapFilter, type MapFilterKey } from "../../../../components/ui/MapFilterChips";

export default function SpaScreen() {
  const [spas, setSpas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapFilters, setMapFilters] = useState<MapFilterKey[]>(["near-me"]);

  const loadSpas = useCallback(async () => {
    try {
      const payload = await listSpas({ limit: 50, nearby: false, ...(searchQuery ? { search: searchQuery } : {}) });
      const items = payload?.items ?? payload?.data ?? payload ?? [];
      setSpas(Array.isArray(items) ? items.map((item) => {
        const spa = normalizeSpa(item);
        return {
          ...item,
          id: spa.id,
          title: spa.title,
          rating: spa.ratingText,
          reviews: spa.reviewsText,
          cuisine: spa.category,
          type: spa.typeText,
          distance: spa.distanceText,
          location: spa.locationText,
          image: spa.imageUrl ? { uri: spa.imageUrl } : undefined,
        };
      }) : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load spas."));
      setSpas([]);
    } finally { setLoading(false); }
  }, [searchQuery]);

  useEffect(() => { const timer = setTimeout(() => void loadSpas(), searchQuery ? 250 : 0); return () => clearTimeout(timer); }, [loadSpas, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SpaSearch value={searchQuery} onChangeText={setSearchQuery} />
        <SpaViewToggle count={spas.length} view={view} onChange={setView} />
        {view === "map" ? <View style={styles.mapFilters}>
          <MapFilterChips
            active={mapFilters}
            locked={["near-me"]}
            onToggle={(filter) => setMapFilters((current) => toggleMapFilter(current, filter))}
          />
        </View> : null}
        {view === "map" ? <CategoryMap items={spas} loading={loading} kind="spa" activeFilters={mapFilters} /> : null}
        {view === "list" ? <SpaFilters /> : null}

        {view === "list" ? <View style={styles.list}>
          {loading ? <ActivityIndicator size="large" color={theme.COLORS.primary} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!loading && !error && spas.length === 0 ? <Text style={styles.error}>No spas available.</Text> : null}
          {spas.map((spa) => (
            <SpaCard key={spa.id} spa={spa} />
          ))}
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  list: {
    marginTop: 5,
    paddingBottom: 20,
  },
  mapFilters: {
    marginTop: 12,
  },
  error: {
    textAlign: "center",
    color: theme.COLORS.textSecondary,
    padding: 24,
  },
});


