// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import theme from "../../../../constants/theme";

const PlanTypeCard = ({
  title,
  subtitle,
  emoji,
  backgroundColor,
  dotColor,
  selected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor },
        selected && { borderWidth: 2, borderColor: dotColor },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <View
              style={[styles.dot, { backgroundColor: dotColor, opacity: 0.5 }]}
            />
            <View
              style={[styles.dot, { backgroundColor: dotColor, opacity: 0.3 }]}
            />
          </View>
        </View>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    ...theme.SHADOWS.card,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emoji: {
    fontSize: 40,
  },
});

export default PlanTypeCard;


