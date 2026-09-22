// @ts-nocheck
import React from "react";
import { StyleSheet, View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const HotelSearch = ({ value = "", onChangeText }) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.COLORS.textSecondary}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search hotels or locations..."
          placeholderTextColor={theme.COLORS.textTertiary}
          style={styles.input}
        />
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
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: theme.COLORS.textPrimary,
  },
});

export default HotelSearch;


