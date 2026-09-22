// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";

const ChatHeader = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={theme.COLORS.textPrimary}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>AI Concierge</Text>
        <Text style={styles.subtitle}>Your personal planning assistant</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Online</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
  },
  backBtn: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  statusText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
});

export default ChatHeader;


