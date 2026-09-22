// @ts-nocheck
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const Step4 = ({ data, setData, onComplete }) => {
  const [vouchersOnly, setVouchersOnly] = useState(data.vouchersOnly || false);
  const [selectedArea, setSelectedArea] = useState(
    data.area || "Anywhere",
  );

  const handleToggle = (value) => {
    setVouchersOnly(value);
    setData({ ...data, vouchersOnly: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Final touches</Text>
      <Text style={styles.subtitle}>Almost there.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Preferred Area</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>{selectedArea}</Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={theme.COLORS.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.voucherIconContainer}>
            <Ionicons name="pricetag" size={24} color="#f472b6" />
          </View>
          <View style={styles.voucherTextContainer}>
            <Text style={styles.voucherTitle}>Vouchers only</Text>
            <Text style={styles.voucherSubtitle}>Show places with offers</Text>
          </View>
          <Switch
            value={vouchersOnly}
            onValueChange={handleToggle}
            trackColor={{ false: "#e2e8f0", true: theme.COLORS.primary }}
            thumbColor={theme.COLORS.white}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.revealButton}
        onPress={onComplete}
        activeOpacity={0.8}
      >
        <Text style={styles.revealButtonText}>Reveal My Plan ✨</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.COLORS.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  voucherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  voucherTextContainer: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
  },
  voucherSubtitle: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginTop: 2,
  },
  revealButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 40,
  },
  revealButtonText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
});

export default Step4;


