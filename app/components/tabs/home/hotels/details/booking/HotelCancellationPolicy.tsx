// @ts-nocheck
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../constants/theme";

const HotelCancellationPolicy = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Cancellation Policy</Text>

      <View style={styles.policyBox}>
        <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
        <View style={styles.policyContent}>
          <Text style={styles.policyTitle}>Free cancellation</Text>
          <Text style={styles.policyDesc}>
            Cancel before Mar 13, 2026 for a full refund
          </Text>
        </View>
      </View>
    </View>
  );
};

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
    marginBottom: 16,
  },
  policyBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
  },
  policyDesc: {
    fontSize: 13,
    color: "#166534",
    marginTop: 2,
  },
});

export default HotelCancellationPolicy;


