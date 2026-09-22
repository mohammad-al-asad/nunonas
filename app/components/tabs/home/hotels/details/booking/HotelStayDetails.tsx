import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../constants/theme";

type HotelStayDetailsProps = {
  checkIn?: string;
  checkOut?: string;
  duration?: string;
};

export default function HotelStayDetails({ checkIn, checkOut, duration }: HotelStayDetailsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Stay Details</Text>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Ionicons name="calendar-outline" size={20} color="#1e3a8a" />
          <Text style={styles.labelText}>Check-in</Text>
        </View>
        <Text style={styles.valueText}>{checkIn || "Feb 15, 2026"}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Ionicons name="calendar-outline" size={20} color="#1e3a8a" />
          <Text style={styles.labelText}>Check-out</Text>
        </View>
        <Text style={styles.valueText}>{checkOut || "Feb 18, 2026"}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Ionicons name="time-outline" size={20} color="#1e3a8a" />
          <Text style={styles.labelText}>Duration</Text>
        </View>
        <Text style={styles.valueText}>{duration || "3 nights"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  labelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  labelText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
});


