// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import theme from "../../../../constants/theme";
import PlanTypeCard from "./PlanTypeCard";

const PLAN_TYPES = [
  {
    id: "chill",
    title: "Chill",
    subtitle: "Relaxed and peaceful vibes",
    emoji: "😌",
    backgroundColor: "#eff6ff", // Light Blue
    dotColor: "#3b82f6",
  },
  {
    id: "party",
    title: "Party",
    subtitle: "Fun and energetic atmosphere",
    emoji: "🎉",
    backgroundColor: "#fdf2f7", // Light Pink
    dotColor: "#d946ef",
  },
  {
    id: "active",
    title: "Active",
    subtitle: "High energy and adventure",
    emoji: "🏃",
    backgroundColor: "#f0fdf4", // Light Green
    dotColor: "#22c55e",
  },
  {
    id: "fancy",
    title: "Fancy",
    subtitle: "Elegant and sophisticated",
    emoji: "✨",
    backgroundColor: "#fffbeb", // Light Yellow
    dotColor: "#eab308",
  },
];

const Step2 = ({ selectedId, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What kind of plan do you want ?</Text>
      <Text style={styles.subtitle}>Select the vibe for your trip</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PLAN_TYPES.map((item) => (
          <PlanTypeCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            emoji={item.emoji}
            backgroundColor={item.backgroundColor}
            dotColor={item.dotColor}
            selected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
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

export default Step2;


