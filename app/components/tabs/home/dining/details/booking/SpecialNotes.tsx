// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import theme from "../../../../../../constants/theme";

const SpecialNotes = ({ notes, onNotesChange }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Special Notes</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Any seating or timing preference?"
        placeholderTextColor={theme.COLORS.textSecondary}
        multiline
        maxLength={2000}
        accessibilityLabel="Special booking notes"
        value={notes}
        onChangeText={onNotesChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  notesInput: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    padding: 15,
    fontSize: 14,
    color: theme.COLORS.textPrimary,
    textAlignVertical: "top",
  },
});

export default SpecialNotes;


