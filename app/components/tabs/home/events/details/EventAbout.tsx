import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import theme from "../../../../../constants/theme";

type EventAboutProps = {
  description?: string;
  artists?: string[];
};

export default function EventAbout({ description, artists }: EventAboutProps) {
  const artistList = Array.isArray(artists) ? artists.filter(Boolean) : [];
  const items = artistList.length
    ? artistList
    : ["Live entertainment", "Food and drinks", "Venue access"];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>About This Event</Text>
      <Text style={styles.description}>
        {description ||
          "Experience a live event near you with venue details, timings, and directions from the app."}
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Event Highlights
      </Text>
      <View style={styles.artistRow}>
        {items.map((artist, index) => (
          <Text key={index} style={styles.artistName}>
            {artist}
            {index < items.length - 1 ? "   " : ""}
          </Text>
        ))}
      </View>

      <TouchableOpacity>
        <Text style={styles.readMore}>Read more</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    lineHeight: 22,
    fontWeight: "500",
  },
  artistRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  readMore: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.primary,
    marginTop: 5,
  },
});


