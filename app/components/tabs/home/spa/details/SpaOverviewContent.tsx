// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import type { NormalizedSpa } from "../../../../../lib/provider-types";

const { width } = Dimensions.get("window");

const AMENITIES = [
  { id: 1, name: "Free WiFi", icon: "wifi", color: "#3b82f6" },
  { id: 2, name: "Parking", icon: "square", color: "#3b82f6" },
  { id: 3, name: "Locker", icon: "lock-closed", color: "#3b82f6" },
  { id: 4, name: "Shower", icon: "water", color: "#3b82f6" },
  { id: 5, name: "Accessible", icon: "body", color: "#3b82f6" },
  { id: 6, name: "Sauna", icon: "flame", color: "#3b82f6" },
];

const SpaOverviewContent = ({ spa }: { spa: NormalizedSpa }) => {
  return (
    <View style={styles.container}>
      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          {spa.description || "No description available."}
        </Text>
      </View>

      {/* Opening Hours Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opening Hours</Text>
        <View style={styles.hoursRow}>
          <Text style={styles.dayText}>Monday - Friday</Text>
          <Text style={styles.timeText}>{spa.openingHours?.open_time && spa.openingHours?.close_time ? `${spa.openingHours.open_time} - ${spa.openingHours.close_time}` : "Not provided"}</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.dayText}>Saturday - Sunday</Text>
          <Text style={styles.timeText}>{spa.openingHours?.open_time && spa.openingHours?.close_time ? `${spa.openingHours.open_time} - ${spa.openingHours.close_time}` : "Not provided"}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{spa.openingHours?.is_open_now === false ? "Closed" : "Open Now"}</Text>
        </View>
      </View>

      {/* Amenities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenityGrid}>
          {spa.amenities.map((name, index) => {
            const item = AMENITIES[index] ?? AMENITIES[0];
            return (
            <View key={item.id} style={styles.amenityItem}>
              <View style={styles.amenityIconBox}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.amenityName}>{name}</Text>
            </View>
          )})}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    lineHeight: 24,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  amenityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  amenityItem: {
    width: (width - 70) / 3,
    backgroundColor: theme.COLORS.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  amenityIconBox: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  amenityName: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
});

export default SpaOverviewContent;


