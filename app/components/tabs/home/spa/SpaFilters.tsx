// @ts-nocheck
import React, { useState } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native";
import theme from "../../../../constants/theme";

const FILTERS = ["Location", "Cuisine", "Budget", "Rating"];

const SpaFilters = () => {
  const [activeFilter, setActiveFilter] = useState("Location");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.COLORS.surface,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  activeChip: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  activeChipText: {
    color: theme.COLORS.white,
  },
});

export default SpaFilters;


