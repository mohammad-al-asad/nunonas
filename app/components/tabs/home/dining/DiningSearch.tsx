import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

type Props = {
  value: string;
  onSearch: (value: string) => void;
  mapMode?: boolean;
};

const DiningSearch = ({ value, onSearch, mapMode = false }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.COLORS.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onSearch}
          placeholder={mapMode ? "Search restaurants or areas" : "Search restaurants..."}
          placeholderTextColor={theme.COLORS.textSecondary}
          style={styles.input}
          returnKeyType="search"
        />
        {value ? (
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => onSearch("")}
            accessibilityLabel="Clear restaurant search"
          >
            <Ionicons
              name="close"
              size={20}
              color={theme.COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
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

export default DiningSearch;


