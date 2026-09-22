// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import BookingCard from "../../../../components/tabs/profile/bookings/BookingCard";
import { listMyBookings } from "../../../../lib/customer-api";

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeBooking = (item) => ({
    ...item,
    title: item.provider_name || item.service || item.title || "Booking",
    category: item.provider_type === "event" ? "Event" : item.provider_type === "hotel" || item.provider_type === "hotel_room" ? "Hotel" : item.provider_type === "spa" ? "Spa" : "Restaurant",
    status: item.status || "pending",
    date: item.scheduled_date || item.date || "Date not available",
    time: item.scheduled_time || item.time || "",
    location: item.provider_area || item.provider_address || item.location || "Location unavailable",
    imageUrl: item.provider_image || item.imageUrl || "",
    bookingId: item.booking_code || item.bookingId || item.id || item._id || "",
  });

  const fetchBookings = useCallback(async (tab) => {
    try {
      const data = await listMyBookings({ status: tab.toLowerCase(), limit: 50 });
      const items = data?.items ?? data ?? [];
      setBookings(items.map(normalizeBooking));
    } catch (err) {
      console.warn("Failed to load bookings:", err.message);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBookings(activeTab);
  }, [fetchBookings, activeTab]);

  const handleViewDetails = (item) => {
    router.push({
      pathname: "/profile/bookings/details",
      params: {
        id: item.id ?? item._id,
        category: item.provider_type ?? item.category ?? "Restaurant",
        title: item.provider_name ?? item.title ?? "Booking",
        status: item.status,
        date: item.date,
        time: item.time,
        location: item.provider_area ?? item.location ?? "",
        imageUrl: item.provider_image ?? item.imageUrl ?? "",
        guests: item.guests,
        notes: item.special_requests ?? item.special_notes ?? item.notes ?? "",
        bookingId: item.bookingId || item.booking_code || `#${(item.id ?? item._id ?? "").slice(0, 8).toUpperCase()}`,
      },
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>
            All your upcoming and past plans
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["Upcoming", "Past"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id ?? item._id ?? String(Math.random())}
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              onViewDetails={() => handleViewDetails(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(activeTab); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} bookings</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginRight: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.COLORS.card,
    marginHorizontal: 20,
    padding: 6,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: theme.COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  activeTabText: {
    color: theme.COLORS.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
});


