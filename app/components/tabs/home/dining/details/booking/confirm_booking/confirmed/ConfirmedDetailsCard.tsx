// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import theme from "../../../../../../../../constants/theme";

const DetailRow = ({ label, value, isBold }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, isBold && styles.boldValue]}>{value}</Text>
  </View>
);

const ConfirmedDetailsCard = ({ details }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Booking Details</Text>
      
      <DetailRow label="Restaurant" value={details.restaurantName} isBold />
      <DetailRow label="Date & Time" value={details.dateTime} isBold />
      <DetailRow label="Guests" value={`${details.guests} people`} isBold />
      <DetailRow label="Seating" value={details.seating} isBold />
      <DetailRow label="Booking ID" value={details.bookingId} isBold />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
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
  label: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
  },
  value: {
    fontSize: 15,
    color: theme.COLORS.textPrimary,
  },
  boldValue: {
    fontWeight: "700",
  },
});

export default ConfirmedDetailsCard;


