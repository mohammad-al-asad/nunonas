// @ts-nocheck
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import SkeletonBlock from "./SkeletonBlock";

// Placeholder for the TrendingNow card carousel (320px cards with a 220px image).
// Rendered below the section header, which stays visible while loading.
export default function TrendingNowSkeleton({ count = 2 }) {
  return (
    <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBlock style={styles.image} />
          <View style={styles.cardContent}>
            <View style={styles.metaRow}>
              <SkeletonBlock style={styles.pill} />
              <SkeletonBlock style={styles.saveBtn} />
            </View>
            <SkeletonBlock style={styles.title} />
            <SkeletonBlock style={styles.line} />
            <SkeletonBlock style={styles.shortLine} />
            <SkeletonBlock style={styles.button} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20 },
  card: { width: 320, marginRight: 18, borderRadius: 30, borderWidth: 1, borderColor: "#f1f3f7", overflow: "hidden" },
  image: { width: "100%", height: 220, borderRadius: 0 },
  cardContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  pill: { width: 90, height: 26, borderRadius: 999 },
  saveBtn: { width: 32, height: 32, borderRadius: 16 },
  title: { width: "75%", height: 20, marginBottom: 14 },
  line: { width: "45%", height: 14, marginBottom: 10 },
  shortLine: { width: "60%", height: 12, marginBottom: 18 },
  button: { height: 56, borderRadius: 18 },
});
