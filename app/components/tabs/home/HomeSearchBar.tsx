import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import theme from "../../../constants/theme";

export default function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const openSearch = () => router.push({ pathname: "/search", params: value.trim() ? { q: value.trim() } : undefined });
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={openSearch}>
      <Ionicons name="search-outline" size={21} color={theme.COLORS.textSecondary} />
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={openSearch}
        returnKeyType="search"
        placeholder="Search restaurants, hotels, spas, events..."
        placeholderTextColor={theme.COLORS.textSecondary}
        style={styles.input}
      />
      <Ionicons name="options-outline" size={20} color={theme.COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 20, marginTop: 20, minHeight: 52, paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: theme.COLORS.border, backgroundColor: theme.COLORS.surface, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, minWidth: 0, color: theme.COLORS.textPrimary, fontSize: 14 },
});
