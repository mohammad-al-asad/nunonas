// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../../constants/theme";

const BookingPolicy = ({ policy = "You can modify or cancel this booking later." }) => {
  return (
    <View style={styles.infoBox}>
      <Ionicons name="information-circle" size={20} color={theme.COLORS.secondary} />
      <Text style={styles.infoText}>{policy}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "500",
    flex: 1,
  },
});

export default BookingPolicy;


