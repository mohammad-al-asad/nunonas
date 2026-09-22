// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const SelectionCard = ({
  icon,
  emoji,
  title,
  subtitle,
  priceRange,
  selected,
  onSelect,
  highlightColor = "#22c55e",
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && { borderColor: highlightColor, borderWidth: 2 },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            {emoji ? (
              <Text style={styles.emoji}>{emoji}</Text>
            ) : (
              <Ionicons name={icon} size={24} color={theme.COLORS.primary} />
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {priceRange && (
              <Text style={[styles.priceRange, { color: highlightColor }]}>
                {priceRange}
              </Text>
            )}
          </View>
        </View>
        <View
          style={[
            styles.radio,
            selected && {
              borderColor: highlightColor,
              backgroundColor: highlightColor,
            },
          ]}
        >
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    lineHeight: 20,
  },
  priceRange: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.COLORS.white,
  },
});

export default SelectionCard;


