// @ts-nocheck
import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../constants/theme";

const InputField = ({
  label,
  iconName,
  rightElement,
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={theme.COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.COLORS.textPlaceholder}
          {...props}
        />
        {rightElement && rightElement}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 15,
  },
  label: {
    fontSize: theme.TYPOGRAPHY.label.fontSize,
    fontWeight: theme.TYPOGRAPHY.label.fontWeight,
    color: "#475569", // Specific label color
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    backgroundColor: theme.COLORS.surface,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    flex: 1,
    height: "100%",
  },
});

export default InputField;


