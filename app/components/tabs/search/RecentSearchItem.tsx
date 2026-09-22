// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

const RecentSearchItem = ({ title, onRemove }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Ionicons
          name="time-outline"
          size={20}
          color={theme.COLORS.textSecondary}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="close" size={20} color={theme.COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 16,
    color: theme.COLORS.textPrimary,
    fontWeight: "500",
  },
});

export default RecentSearchItem;


