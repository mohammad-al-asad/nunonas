// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

const ProfileMenuItem = ({
  icon,
  title,
  showArrow = true,
  switchValue,
  onSwitchChange,
  onPress,
  isLast,
}) => {
  const isSwitch = onSwitchChange !== undefined;

  const Content = (
    <View style={[styles.container, isLast && styles.lastItem]}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={theme.COLORS.textPrimary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#e2e8f0", true: theme.COLORS.primary }}
          thumbColor={theme.COLORS.white}
        />
      ) : (
        showArrow && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.COLORS.textSecondary}
          />
        )
      )}
    </View>
  );

  if (isSwitch) {
    return <View>{Content}</View>;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    backgroundColor: theme.COLORS.white,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    color: theme.COLORS.textPrimary,
    fontWeight: "500",
  },
});

export default ProfileMenuItem;


