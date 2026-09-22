import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

type EventTab = "List" | "Map";

type EventFilterToggleProps = {
  eventCount?: number;
  activeTab?: EventTab;
  onChangeTab?: (tab: EventTab) => void;
};

export default function EventFilterToggle({
  eventCount = 0,
  activeTab = "List",
  onChangeTab,
}: EventFilterToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "List" && styles.activeTab]}
          onPress={() => onChangeTab?.("List")}
        >
          <Ionicons
            name="list"
            size={18}
            color={
              activeTab === "List"
                ? theme.COLORS.primary
                : theme.COLORS.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "List" && styles.activeTabText,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "Map" && styles.activeTab]}
          onPress={() => onChangeTab?.("Map")}
        >
          <MaterialCommunityIcons
            name="map-outline"
            size={18}
            color={
              activeTab === "Map"
                ? theme.COLORS.primary
                : theme.COLORS.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "Map" && styles.activeTabText,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.eventCount}>{eventCount} Events</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: theme.COLORS.surface,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: theme.COLORS.white,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  activeTabText: {
    color: theme.COLORS.textPrimary,
  },
  eventCount: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
});


