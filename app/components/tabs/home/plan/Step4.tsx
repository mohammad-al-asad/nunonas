// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const Step4 = ({ data, setData, onComplete }) => {
  const [vouchersOnly, setVouchersOnly] = useState(data.vouchersOnly || false);
  // An empty field means "Anywhere".
  const [area, setArea] = useState(data.area && data.area !== "Anywhere" ? data.area : "");

  const handleToggle = (value) => {
    setVouchersOnly(value);
    setData({ ...data, vouchersOnly: value });
  };

  const handleAreaChange = (value) => {
    setArea(value);
    setData({ ...data, area: value.trim() || "Anywhere" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Final touches</Text>
      <Text style={styles.subtitle}>Almost there.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Preferred Area</Text>
        <View style={styles.areaInputWrap}>
          <Ionicons name="location-outline" size={20} color={theme.COLORS.textSecondary} />
          <TextInput
            style={styles.areaInput}
            value={area}
            onChangeText={handleAreaChange}
            placeholder="e.g. Gulshan, Dhaka"
            placeholderTextColor={theme.COLORS.textSecondary}
            accessibilityLabel="Preferred area"
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={120}
          />
        </View>
        <Text style={styles.helper}>Leave empty to search anywhere.</Text>

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
  areaInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  areaInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.COLORS.textPrimary,
  },
  helper: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 12,
    color: theme.COLORS.textSecondary,
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


