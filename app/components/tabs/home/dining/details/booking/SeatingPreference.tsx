// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import theme from "../../../../../../constants/theme";

const SeatingPreference = ({ seating, onSeatingChange, preferences = ["Indoor", "Outdoor", "No preference"] }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Seating Preference</Text>
      <View style={styles.seatingRow}>
        {preferences.map((pref, index) => (
          <TouchableOpacity
            key={`${pref}-${index}`}
            style={[
              styles.seatingOption,
              seating === pref && styles.selectedSeatingOption,
            ]}
            onPress={() => onSeatingChange(pref)}
          >
            <Text style={[
              styles.seatingText,
              seating === pref && styles.selectedSeatingText,
            ]}>
              {pref}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  seatingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  seatingOption: {
    width: "31%",
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSeatingOption: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  seatingText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
  },
  selectedSeatingText: {
    color: theme.COLORS.white,
  },
});

export default SeatingPreference;


