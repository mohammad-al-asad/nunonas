// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

const BonusPointsCard = ({ points }) => {
  return (
    <View style={styles.pointsCardContainer}>
      <View style={styles.pointsCard}>
        <View style={styles.pointsIconBg}>
          <Ionicons name="gift" size={24} color={theme.COLORS.white} />
        </View>
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsLabel}>Bonus Points</Text>
          <Text style={styles.pointsValue}>{points || "0"}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pointsCardContainer: {
    paddingHorizontal: 20,
    marginTop: -45,
    marginBottom: 25,
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...theme.SHADOWS.card,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  pointsIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  pointsValue: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
});

export default BonusPointsCard;


