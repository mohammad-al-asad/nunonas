// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../constants/theme";

const BookingDetailsRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={22} color={theme.COLORS.primary} />
    </View>
    <View style={styles.textBox}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const SpaBookingDetails = ({ date, time, guests, treatment }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Booking Details</Text>
      <BookingDetailsRow icon="calendar-outline" label="Date" value={date} />
      <BookingDetailsRow icon="time-outline" label="Time" value={time} />
      <BookingDetailsRow
        icon="people-outline"
        label="Number of Guests"
        value={`${guests} People`}
      />
      {treatment && (
        <BookingDetailsRow
          icon="sparkles-outline"
          label="Treatment"
          value={treatment}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  textBox: {
    marginLeft: 16,
  },
  label: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
});

export default SpaBookingDetails;


