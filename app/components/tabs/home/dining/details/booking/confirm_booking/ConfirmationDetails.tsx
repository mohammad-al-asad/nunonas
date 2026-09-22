// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../../constants/theme";

const DetailItem = ({ icon, label, value }) => (
  <View style={styles.item}>
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={24} color={theme.COLORS.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const ConfirmationDetails = ({ date, time, guests, seating }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Booking Details</Text>
      
      <DetailItem 
        icon="calendar-outline" 
        label="Date" 
        value={date} 
      />
      
      <DetailItem 
        icon="time-outline" 
        label="Time" 
        value={time} 
      />
      
      <DetailItem 
        icon="people-outline" 
        label="Number of Guests" 
        value={`${guests} People`} 
      />

      <DetailItem 
        icon="restaurant-outline" 
        label="Seating Type" 
        value={seating} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
});

export default ConfirmationDetails;


