// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import theme from "../../../../../constants/theme";

const TABS = ["Overview", "Menu", "Gallery", "Reviews"];

const DetailsTabs = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => onTabPress(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.indicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 30, // Large gap between tabs
  },
  tab: {
    paddingVertical: 15,
    position: "relative",
  },
  activeTab: {
    // No specific style needed here if using indicator
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  activeTabText: {
    color: theme.COLORS.primary,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.COLORS.primary,
    borderRadius: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.COLORS.border,
  },
});

export default DetailsTabs;


