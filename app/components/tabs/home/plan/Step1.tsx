// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import theme from "../../../../constants/theme";
import SelectionCard from "./SelectionCard";

const COMPANIONS = [
  {
    id: "couple",
    title: "Couple",
    subtitle: "Romantic getaway for two",
    emoji: "💑",
  },
  {
    id: "friends",
    title: "Friends",
    subtitle: "Adventure with your crew",
    emoji: "👬",
  },
  {
    id: "family",
    title: "Family",
    subtitle: "Quality time with loved ones",
    emoji: "👪",
  },
  {
    id: "solo",
    title: "Solo",
    subtitle: "Explore on your own terms",
    emoji: "🙋‍♂️",
  },
];

const Step1 = ({ selectedId, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you going with?</Text>
      <Text style={styles.subtitle}>Select your travel companions</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {COMPANIONS.map((item) => (
          <SelectionCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            emoji={item.emoji}
            selected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
            highlightColor={theme.COLORS.primary}
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

export default Step1;


