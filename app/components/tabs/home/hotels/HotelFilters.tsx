// @ts-nocheck
import React, { useState } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native";
import theme from "../../../../constants/theme";

const FILTERS = [
  "Budget",
  "Luxury",
  "Family-friendly",
  "Near Metro",
  "Breakfast Inc.",
];

const HotelFilters = () => {
  const [activeFilter, setActiveFilter] = useState("Budget");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[styles.chip, activeFilter === filter && styles.activeChip]}
          onPress={() => setActiveFilter(filter)}
        >
          <Text
            style={[
              styles.chipText,
              activeFilter === filter && styles.activeChipText,
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  content: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 5,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  activeChip: {
    backgroundColor: "#1e3a8a", // Dark Blue
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.COLORS.textSecondary,
  },
  activeChipText: {
    color: theme.COLORS.white,
  },
});

export default HotelFilters;


