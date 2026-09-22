import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import theme from "../../constants/theme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  style,
  textStyle,
  icon,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, theme.SHADOWS.primary, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.COLORS.white}
            style={styles.spinner}
          />
        ) : null}
        <Text style={[styles.text, textStyle]}>{title}</Text>
        {!loading && icon ? icon : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.COLORS.primary,
    flexDirection: "row",
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginRight: 10,
  },
  text: {
    color: theme.COLORS.white,
    fontSize: theme.TYPOGRAPHY.button.fontSize,
    fontWeight: theme.TYPOGRAPHY.button.fontWeight as TextStyle["fontWeight"],
  },
});


