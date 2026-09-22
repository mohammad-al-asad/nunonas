import React from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import theme from "../../constants/theme";

type PromoCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  loading?: boolean;
  appliedPromotion?: string | null;
  error?: string;
};

export default function PromoCodeInput({
  value,
  onChange,
  onApply,
  loading = false,
  appliedPromotion,
  error,
}: PromoCodeInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promotion code</Text>
      <Text style={styles.description}>Optional. Enter a code supplied by the service provider.</Text>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.trimStart().toUpperCase())}
          placeholder="Enter promo code"
          placeholderTextColor={theme.COLORS.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={onApply}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Apply</Text>}
        </TouchableOpacity>
      </View>
      {appliedPromotion ? <Text style={styles.success}>{appliedPromotion} applied</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 16,
    backgroundColor: theme.COLORS.white,
    padding: 18,
  },
  title: {
    color: theme.COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: theme.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    minWidth: 78,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  success: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  error: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
});
