// @ts-nocheck
import React from "react";
import { StyleSheet, View } from "react-native";
import SkeletonBlock from "./SkeletonBlock";

// Placeholder for the UpcomingBookings card (icon + three text lines).
// Rendered below the section header, which stays visible while loading.
export default function UpcomingBookingsSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={styles.icon} />
      <View style={styles.body}>
        <SkeletonBlock style={styles.name} />
        <SkeletonBlock style={styles.meta} />
        <SkeletonBlock style={styles.location} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 20, backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#dbeafe" },
  icon: { width: 44, height: 44, borderRadius: 15 },
  body: { flex: 1, gap: 7 },
  name: { width: "65%", height: 15 },
  meta: { width: "40%", height: 12 },
  location: { width: "80%", height: 12 },
});
