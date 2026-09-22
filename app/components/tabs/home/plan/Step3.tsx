// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import theme from "../../../../constants/theme";
import SelectionCard from "./SelectionCard";

const BUDGETS = [
  {
    id: "budget-friendly",
    title: "Budget-friendly",
    subtitle: "Perfect for those seeking value without compromise.",
    priceRange: "$0 - $500",
    icon: "wallet-outline",
    highlightColor: "#22c55e",
  },
  {
    id: "moderate",
    title: "Moderate",
    subtitle: "The sweet spot between quality and affordability.",
    priceRange: "$500 - $2,000",
    icon: "card-outline",
    highlightColor: "#22c55e",
  },
  {
    id: "high-end",
    title: "High-end",
    subtitle: "Premium choices for those who want the very best.",
    priceRange: "$2,000+",
    icon: "diamond-outline",
    highlightColor: "#a855f7",
  },
];

const Step3 = ({ selectedId, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How much do you want to spend ?</Text>
      <Text style={styles.subtitle}>
        Choose the budget range that works best for you
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BUDGETS.map((item) => (
          <SelectionCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            priceRange={item.priceRange}
            icon={item.icon}
            selected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
            highlightColor={item.highlightColor}
          />
        ))}
      </ScrollView>
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
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    marginBottom: 30,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default Step3;


