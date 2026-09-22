// @ts-nocheck
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../../constants/theme";

// Import Hotel Components
import HotelSearch from "../../../../components/tabs/home/hotels/HotelSearch";
import HotelViewToggle from "../../../../components/tabs/home/hotels/HotelViewToggle";
import HotelFilters from "../../../../components/tabs/home/hotels/HotelFilters";
import HotelCard from "../../../../components/tabs/home/hotels/HotelCard";
import CategoryMap from "../../../../components/tabs/home/CategoryMap";
import { listHotels } from "../../../../lib/customer-api";

const HotelScreen = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchHotels() {
      try {
        setError("");
        const res = await listHotels({ nearby: false, limit: 100, ...(searchQuery ? { search: searchQuery } : {}) });
        setHotels(res.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load hotels right now.");
        console.error("Failed to fetch hotels from API:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHotels();
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HotelSearch value={searchQuery} onChangeText={setSearchQuery} />
        <View style={styles.headerRow}>
          <HotelViewToggle view={view} onChange={setView} />
          <Text style={styles.resultsCount}>{loading ? "..." : `${hotels.length} Hotels`}</Text>
        </View>
        {view === "list" ? <HotelFilters /> : null}

        {view === "map" ? <CategoryMap items={hotels} loading={loading} kind="hotel" /> : null}

        {view === "list" && loading ? (
          <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 40 }} />
        ) : view === "list" && error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Hotels could not be loaded</Text>
            <Text style={styles.emptyText}>Please try again in a moment.</Text>
          </View>
        ) : view === "list" && hotels.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hotels available</Text>
            <Text style={styles.emptyText}>Approved hotels with available rooms will appear here.</Text>
          </View>
        ) : view === "list" ? (
          <View style={styles.list}>
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  list: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyState: {
    marginHorizontal: 20,
    marginTop: 40,
    padding: 24,
    borderRadius: 20,
    backgroundColor: theme.COLORS.surface,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: theme.COLORS.textPrimary },
  emptyText: { marginTop: 6, textAlign: "center", color: theme.COLORS.textSecondary },
});

export default HotelScreen;


