// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../../../constants/theme";

const SuccessHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={50} color={theme.COLORS.white} />
      </View>
      <Text style={styles.title}>Booking Request Sent</Text>
      <Text style={styles.subtitle}>The service provider will confirm your table booking.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#60a5fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    ...theme.SHADOWS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default SuccessHeader;


