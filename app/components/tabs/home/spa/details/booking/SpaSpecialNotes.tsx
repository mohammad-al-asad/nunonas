// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import theme from "../../../../../../constants/theme";

const SpaSpecialNotes = ({ notes, onNotesChange, editable = true }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Special Notes</Text>
      {editable ? (
        <TextInput
          style={styles.notesInput}
          placeholder="Any seating or timing preference?"
          placeholderTextColor={theme.COLORS.textSecondary}
          multiline
          value={notes}
          onChangeText={onNotesChange}
        />
      ) : (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>
            {notes || "Any seating or timing preference?"}
          </Text>
        </View>
      )}
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
  notesBox: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    padding: 15,
  },
  notesText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
});

export default SpaSpecialNotes;


