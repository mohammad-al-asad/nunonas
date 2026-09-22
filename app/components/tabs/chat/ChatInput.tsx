// @ts-nocheck
import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

const ChatInput = ({ value, onChangeText, onSend, disabled = false }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, disabled && styles.inputWrapperDisabled]}>
        <TextInput
          style={styles.input}
          placeholder="Tell me what you'd like to plan..."
          placeholderTextColor={theme.COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          multiline
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={disabled ? undefined : onSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, disabled && styles.sendBtnDisabled]}
          onPress={onSend}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <View style={[styles.sendIconBg, disabled && styles.sendIconBgDisabled]}>
            <Ionicons name="paper-plane" size={20} color={theme.COLORS.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.COLORS.white,
    borderTopWidth: 0,
    borderTopColor: theme.COLORS.border,
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    marginLeft: 12,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIconBgDisabled: {
    backgroundColor: theme.COLORS.textSecondary,
  },
  inputWrapperDisabled: {
    opacity: 0.7,
  },
});

export default ChatInput;


