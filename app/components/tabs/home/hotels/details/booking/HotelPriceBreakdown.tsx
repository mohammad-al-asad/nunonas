// @ts-nocheck
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import theme from "../../../../../../constants/theme";

const HotelPriceBreakdown = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Price Breakdown</Text>

      <View style={styles.row}>
        <Text style={styles.labelText}>$280 × 3 nights</Text>
        <Text style={styles.valueText}>$840.00</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.labelText}>Service fee</Text>
        <Text style={styles.valueText}>$42.00</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.labelText}>Taxes</Text>
        <Text style={styles.valueText}>$67.20</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>$949.20</Text>
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
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
  },
  valueText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e3a8a",
  },
});

export default HotelPriceBreakdown;


