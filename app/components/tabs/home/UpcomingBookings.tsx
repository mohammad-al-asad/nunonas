// @ts-nocheck
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";
import { useUpcomingBookingsQuery } from "../../../lib/queries/homeQueries";

export default function UpcomingBookings() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useUpcomingBookingsQuery();
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  if (isLoading) return <ActivityIndicator style={styles.loading} color={theme.COLORS.primary} />;
  if (isError) return <TouchableOpacity style={styles.status} onPress={() => refetch()}><Text style={styles.statusText}>Bookings unavailable. Tap to retry.</Text></TouchableOpacity>;
  if (!items.length) return null;
  const booking = items[0];
  return <View style={styles.container}>
    <View style={styles.header}><Text style={styles.title}>Upcoming booking</Text><TouchableOpacity onPress={() => router.push("/profile/bookings" as any)}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push({ pathname: "/profile/bookings/details", params: { bookingId: String(booking.id ?? booking.booking_id ?? "") } } as any)}>
      <View style={styles.icon}><Ionicons name="calendar" size={22} color={theme.COLORS.primary} /></View>
      <View style={styles.body}><Text style={styles.name} numberOfLines={1}>{booking.provider_name ?? booking.vendor_name ?? booking.title ?? "Your reservation"}</Text><Text style={styles.meta}>{booking.date ?? booking.booking_date ?? "Upcoming"}{booking.time ? ` · ${booking.time}` : ""}</Text><Text style={styles.location} numberOfLines={1}>{booking.address ?? booking.location ?? "View booking details"}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.COLORS.textSecondary} />
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({ loading: { marginTop: 24 }, container: { marginHorizontal: 20, marginTop: 28 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, title: { color: theme.COLORS.textPrimary, fontSize: 20, fontWeight: "800" }, seeAll: { color: theme.COLORS.primary, fontSize: 13, fontWeight: "700" }, card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 20, backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#dbeafe" }, icon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: theme.COLORS.white }, body: { flex: 1 }, name: { color: theme.COLORS.textPrimary, fontSize: 15, fontWeight: "800" }, meta: { color: theme.COLORS.primary, fontSize: 12, fontWeight: "700", marginTop: 4 }, location: { color: theme.COLORS.textSecondary, fontSize: 12, marginTop: 3 }, status: { marginHorizontal: 20, marginTop: 24, padding: 15, borderRadius: 14, backgroundColor: theme.COLORS.surface }, statusText: { color: theme.COLORS.textSecondary, textAlign: "center", fontSize: 13 } });
