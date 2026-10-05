// @ts-nocheck
import React from "react";
import { StyleSheet, View } from "react-native";
import theme from "../../constants/theme";
import SkeletonBlock from "./SkeletonBlock";

// Placeholder for the FeaturedExperiences list (row cards with a 100px thumbnail).
// Rendered below the section title/subtitle, which stay visible while loading.
export default function FeaturedExperiencesSkeleton({ count = 3 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBlock style={styles.image} />
          <View style={styles.cardContent}>
            <SkeletonBlock style={styles.pill} />
            <SkeletonBlock style={styles.title} />
            <SkeletonBlock style={styles.details} />
            <View style={styles.actionRow}>
              <SkeletonBlock style={styles.button} />
              <SkeletonBlock style={styles.saveBtn} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  card: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 24, borderWidth: 1, borderColor: theme.COLORS.border, backgroundColor: theme.COLORS.white },
  image: { width: 100, height: 100, borderRadius: 16 },
  cardContent: { flex: 1, marginLeft: 16 },
  pill: { width: 110, height: 20, borderRadius: 999, marginBottom: 10 },
  title: { width: "80%", height: 17, marginBottom: 8 },
  details: { width: "50%", height: 13, marginBottom: 12 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  button: { width: 110, height: 36 },
  saveBtn: { width: 32, height: 32, borderRadius: 16 },
});
