// @ts-nocheck
import React from "react";
import { StyleSheet, View } from "react-native";
import SkeletonBlock from "./SkeletonBlock";

// Mirrors the "My reviews" card (provider, date, rating badge, stars, text, reply line).
export default function ReviewListSkeleton({ count = 3 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.header}>
            <SkeletonBlock style={styles.avatar} />
            <View style={styles.provider}>
              <SkeletonBlock style={styles.name} />
              <SkeletonBlock style={styles.date} />
            </View>
            <SkeletonBlock style={styles.badge} />
          </View>
          <View style={styles.stars}>
            {Array.from({ length: 5 }, (_, star) => (
              <SkeletonBlock key={star} style={styles.star} />
            ))}
          </View>
          <SkeletonBlock style={styles.text} />
          <SkeletonBlock style={styles.text} />
          {index % 2 === 0 && <SkeletonBlock style={styles.textShort} />}
          <SkeletonBlock style={styles.reply} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { padding: 18, marginBottom: 14, borderRadius: 22, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 15 },
  provider: { flex: 1, marginLeft: 12, gap: 7 },
  name: { width: "60%", height: 15 },
  date: { width: "35%", height: 11 },
  badge: { width: 56, height: 30, borderRadius: 12 },
  stars: { flexDirection: "row", gap: 4, marginTop: 16, marginBottom: 12 },
  star: { width: 16, height: 16, borderRadius: 8 },
  text: { width: "100%", height: 12, marginBottom: 8 },
  textShort: { width: "65%", height: 12, marginBottom: 8 },
  reply: { width: "50%", height: 10, marginTop: 8 },
});
