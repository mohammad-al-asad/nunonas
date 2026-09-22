// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import theme from "../../../../../../../constants/theme";

const ConfirmNotes = ({ notes, onNotesChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Special Notes</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Any seating or timing preference?"
        placeholderTextColor={theme.COLORS.textSecondary}
        multiline
        maxLength={2000}
        textAlignVertical="top"
        accessibilityLabel="Special booking notes"
        value={notes}
        onChangeText={onNotesChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    minHeight: 120,
    fontSize: 16,
    color: theme.COLORS.textPrimary,
    lineHeight: 24,
    textAlignVertical: "top",
  },
});

export default ConfirmNotes;


