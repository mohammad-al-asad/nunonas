// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../constants/theme";

const GuestCounter = ({ guests, onGuestsChange }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Number of Guests</Text>
      <View style={styles.guestsContainer}>
        <Text style={styles.guestsLabel}>Guests</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => onGuestsChange(Math.max(1, guests - 1))}
          >
            <Ionicons name="remove" size={20} color={theme.COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.guestsCount}>{guests}</Text>
          <TouchableOpacity
            style={[styles.counterButton, styles.plusButton]}
            onPress={() => onGuestsChange(guests + 1)}
          >
            <Ionicons name="add" size={20} color={theme.COLORS.white} />
          </TouchableOpacity>
        </View>
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
  guestsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  guestsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    backgroundColor: theme.COLORS.primary,
  },
  guestsCount: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    minWidth: 20,
    textAlign: "center",
  },
});

export default GuestCounter;


