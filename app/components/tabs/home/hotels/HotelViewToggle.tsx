// @ts-nocheck
import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const HotelViewToggle = ({ view = "list", onChange }) => {

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.toggleBtn, view === "list" && styles.activeBtn]}
        onPress={() => onChange?.("list")}
      >
        <Ionicons
          name="list"
          size={18}
          color={
            view === "list"
              ? theme.COLORS.primary
              : theme.COLORS.textSecondary
          }
        />
        <Text
          style={[styles.btnText, view === "list" && styles.activeText]}
        >
          List
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleBtn, view === "map" && styles.activeBtn]}
        onPress={() => onChange?.("map")}
      >
        <Ionicons
          name="map"
          size={18}
          color={
            view === "map"
              ? theme.COLORS.primary
              : theme.COLORS.textSecondary
          }
        />
        <Text
          style={[styles.btnText, view === "map" && styles.activeText]}
        >
          Map
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 2,
    alignSelf: "flex-start",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  activeBtn: {
    backgroundColor: theme.COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  activeText: {
    color: theme.COLORS.primary,
  },
});

export default HotelViewToggle;


