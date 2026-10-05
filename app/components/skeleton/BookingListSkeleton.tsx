// @ts-nocheck
import React from "react";
import { StyleSheet, View } from "react-native";
import theme from "../../constants/theme";
import SkeletonBlock from "./SkeletonBlock";

// Mirrors BookingCard (100px image + title, category, date, location, "View Details").
export default function BookingListSkeleton({ count = 4 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBlock style={styles.image} />
          <View style={styles.details}>
            <SkeletonBlock style={styles.title} />
            <SkeletonBlock style={styles.category} />
            <SkeletonBlock style={styles.line} />
            <SkeletonBlock style={styles.lineShort} />
            <SkeletonBlock style={styles.link} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingTop: 10 },
  card: { flexDirection: "row", padding: 12, marginBottom: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.COLORS.border, backgroundColor: theme.COLORS.white },
  image: { width: 100, height: 100, borderRadius: 15 },
  details: { flex: 1, marginLeft: 15, justifyContent: "space-between", paddingVertical: 2 },
  title: { width: "75%", height: 16 },
  category: { width: "30%", height: 11 },
  line: { width: "55%", height: 11 },
  lineShort: { width: "70%", height: 11 },
  link: { width: "35%", height: 11 },
});
