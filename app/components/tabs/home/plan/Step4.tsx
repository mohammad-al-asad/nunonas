// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

// Static areas until a location search provider is wired up.
const AREA_OPTIONS = ["Anywhere", "Dhaka", "Feni", "Comilla"];

const Step4 = ({ data, setData, onComplete }) => {
  const [vouchersOnly, setVouchersOnly] = useState(data.vouchersOnly || false);
  const [selectedArea, setSelectedArea] = useState(
    data.area || "Anywhere",
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [customArea, setCustomArea] = useState("");

  const handleToggle = (value) => {
    setVouchersOnly(value);
    setData({ ...data, vouchersOnly: value });
  };

  const handleSelectArea = (area) => {
    const value = area.trim();
    if (!value) return;
    setSelectedArea(value);
    setData({ ...data, area: value });
    setCustomArea("");
    setPickerOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Final touches</Text>
      <Text style={styles.subtitle}>Almost there.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Preferred Area</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
        >
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

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Preferred Area</Text>
            {AREA_OPTIONS.map((area) => (
              <TouchableOpacity
                key={area}
                style={styles.option}
                onPress={() => handleSelectArea(area)}
              >
                <Text style={styles.optionText}>{area}</Text>
                {selectedArea === area && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customArea}
                onChangeText={setCustomArea}
                placeholder="Or type another area"
                placeholderTextColor={theme.COLORS.textSecondary}
                returnKeyType="done"
                onSubmitEditing={() => handleSelectArea(customArea)}
                maxLength={60}
              />
              <TouchableOpacity
                style={[
                  styles.customButton,
                  !customArea.trim() && styles.customButtonDisabled,
                ]}
                onPress={() => handleSelectArea(customArea)}
                disabled={!customArea.trim()}
              >
                <Ionicons name="checkmark" size={20} color={theme.COLORS.white} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  optionText: {
    fontSize: 16,
    color: theme.COLORS.textPrimary,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.COLORS.textPrimary,
  },
  customButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  customButtonDisabled: {
    opacity: 0.5,
  },
});

export default Step4;


