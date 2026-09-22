// @ts-nocheck
import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const SpaSearch = ({ value = "", onChangeText }) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.COLORS.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search Spa..."
          placeholderTextColor={theme.COLORS.textSecondary}
          style={styles.input}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons
            name="options-outline"
            size={20}
            color={theme.COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.COLORS.textPrimary,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SpaSearch;


