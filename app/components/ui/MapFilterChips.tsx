import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import theme from "../../constants/theme";

export type MapFilterKey =
  | "near-me"
  | "open-now"
  | "top-rated"
  | "offers"
  | "near-metro";

type Props = {
  active: MapFilterKey[];
  onToggle: (filter: MapFilterKey) => void;
  showLabel?: boolean;
  locked?: MapFilterKey[];
};

const FILTERS: Array<{
  key: MapFilterKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}> = [
  { key: "near-me", label: "Near me", icon: "location" },
  { key: "open-now", label: "Open now", icon: "time" },
  { key: "top-rated", label: "Top rated", icon: "star" },
  { key: "offers", label: "Offers", icon: "pricetag" },
  { key: "near-metro", label: "Near metro", icon: "train" },
];

export default function MapFilterChips({
  active,
  onToggle,
  showLabel = true,
  locked = [],
}: Props) {
  return (
    <View style={styles.wrapper}>
      {showLabel ? <Text style={styles.label}>Filter</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FILTERS.map((filter) => {
          const selected = active.includes(filter.key);
          const disabled = locked.includes(filter.key);
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => {
                if (!disabled) onToggle(filter.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`Filter by ${filter.label}`}
            >
              <Ionicons
                name={filter.icon}
                size={14}
                color={selected ? "#ffffff" : "#334155"}
              />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function toggleMapFilter(
  active: MapFilterKey[],
  filter: MapFilterKey,
): MapFilterKey[] {
  return active.includes(filter)
    ? active.filter((item) => item !== filter)
    : [...active, filter];
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    paddingHorizontal: 20,
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  row: {
    gap: 8,
    paddingHorizontal: 20,
    paddingRight: 30,
  },
  chip: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dbe2ea",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  chipSelected: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primary,
  },
  chipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
});
