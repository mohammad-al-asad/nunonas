import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

export type DiningView = "list" | "map";

type Props = {
  count: number;
  view: DiningView;
  onChange: (view: DiningView) => void;
};

const DiningViewToggle = ({ count, view, onChange }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleGroup}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "list" && styles.activeBtn]}
          onPress={() => onChange("list")}
        >
          <Ionicons
            name="list"
            size={18}
            color={
              view === "list"
                ? theme.COLORS.primary
                : theme.COLORS.textSecondary
            }
          />
          <Text style={[styles.btnText, view === "list" && styles.activeText]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "map" && styles.activeBtn]}
          onPress={() => onChange("map")}
        >
          <Ionicons
            name="map"
            size={18}
            color={
              view === "map" ? theme.COLORS.primary : theme.COLORS.textSecondary
            }
          />
          <Text style={[styles.btnText, view === "map" && styles.activeText]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.countText}>{count} restaurants</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: theme.COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeBtn: {
    backgroundColor: theme.COLORS.white,
    ...theme.SHADOWS.primary,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  activeText: {
    color: theme.COLORS.primary,
  },
  countText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
});

export default DiningViewToggle;


