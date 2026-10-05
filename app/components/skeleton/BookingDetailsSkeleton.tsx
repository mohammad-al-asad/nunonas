// @ts-nocheck
import React from "react";
import { StyleSheet, View } from "react-native";
import theme from "../../constants/theme";
import SkeletonBlock from "./SkeletonBlock";

// Placeholder for the booking details body (provider card, booking info rows, actions).
// Rendered below the real "Booking Details" header, which stays visible while loading.
export default function BookingDetailsSkeleton({ rows = 7 }) {
  return (
    <View style={styles.container}>
      <View style={styles.providerCard}>
        <SkeletonBlock style={styles.title} />
        <SkeletonBlock style={styles.category} />
        <View style={styles.infoRow}>
          <SkeletonBlock style={styles.icon} />
          <SkeletonBlock style={styles.infoLine} />
        </View>
        <View style={styles.infoRow}>
          <SkeletonBlock style={styles.icon} />
          <SkeletonBlock style={styles.infoLineShort} />
        </View>
      </View>

      <View style={styles.detailCard}>
        <SkeletonBlock style={styles.cardTitle} />
        {Array.from({ length: rows }, (_, index) => (
          <View key={index} style={[styles.row, index < rows - 1 && styles.rowDivider]}>
            <SkeletonBlock style={styles.rowLabel} />
            <SkeletonBlock style={[styles.rowValue, index % 2 === 0 && styles.rowValueWide]} />
          </View>
        ))}
      </View>

      <SkeletonBlock style={styles.button} />
      <SkeletonBlock style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 16 },
  providerCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.COLORS.border, backgroundColor: theme.COLORS.white, gap: 12 },
  title: { width: "60%", height: 22, borderRadius: 6 },
  category: { width: "30%", height: 14, borderRadius: 6, marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 20, height: 20, borderRadius: 10 },
  infoLine: { width: "70%", height: 14 },
  infoLineShort: { width: "45%", height: 14 },
  detailCard: { padding: 20, borderRadius: 20, backgroundColor: "#eef4ff" },
  cardTitle: { width: "45%", height: 18, borderRadius: 6, marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.06)" },
  rowLabel: { width: "28%", height: 13 },
  rowValue: { width: "22%", height: 13 },
  rowValueWide: { width: "38%" },
  button: { height: 52, borderRadius: 14 },
});
