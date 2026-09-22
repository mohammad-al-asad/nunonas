// @ts-nocheck
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { resetPassword } from "../../lib/customer-api";
import { clearPendingResetToken, getPendingResetToken } from "../../lib/pending-reset";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
    if (score === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
    if (score === 3) return { label: "Good", color: "#3b82f6", width: "75%" };
    return { label: "Strong", color: "#22c55e", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Required", "Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Too Short", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match. Please try again.");
      return;
    }

    const resetToken = getPendingResetToken();
    if (!resetToken) {
      Alert.alert("Verification Required", "Verify your reset code again before setting a new password.");
      router.replace("/auth/forgot-password");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
      });
      clearPendingResetToken();

      Alert.alert(
        "Password Reset! 🎉",
        "Your password has been updated successfully. You can now login with your new password.",
        [
          {
            text: "Login Now",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Reset Failed", error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View style={styles.iconBadge}>
            <Ionicons name="shield-checkmark-outline" size={40} color={theme.COLORS.primary} />
          </View>

          {/* Header */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password that you haven't used before.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formArea}>
            {/* New Password */}
            <InputField
              label="New Password"
              iconName="lock-closed-outline"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoComplete="new-password"
              rightElement={
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            {/* Password strength bar */}
            {strength && (
              <View style={styles.strengthArea}>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      { width: strength.width, backgroundColor: strength.color },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            {/* Password requirements */}
            <View style={styles.requirementsArea}>
              {[
                { label: "At least 8 characters", met: newPassword.length >= 8 },
                { label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
                { label: "One number", met: /[0-9]/.test(newPassword) },
              ].map((req) => (
                <View key={req.label} style={styles.requirementRow}>
                  <Ionicons
                    name={req.met ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={req.met ? theme.COLORS.success : theme.COLORS.border}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      req.met && styles.requirementMet,
                    ]}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Confirm Password */}
            <InputField
              label="Confirm New Password"
              iconName="lock-closed-outline"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoComplete="new-password"
              rightElement={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchRow}>
                <Ionicons
                  name={
                    newPassword === confirmPassword
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={16}
                  color={
                    newPassword === confirmPassword
                      ? theme.COLORS.success
                      : theme.COLORS.error
                  }
                />
                <Text
                  style={[
                    styles.matchText,
                    {
                      color:
                        newPassword === confirmPassword
                          ? theme.COLORS.success
                          : theme.COLORS.error,
                    },
                  ]}
                >
                  {newPassword === confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </Text>
              </View>
            )}

            <Button
              title={loading ? "Resetting..." : "Reset Password"}
              onPress={handleReset}
              loading={loading}
              style={styles.resetBtn}
            />

            {/* Back to login */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  scrollContent: {
    paddingBottom: 50,
    flexGrow: 1,
  },
  backBtn: {
    marginTop: 10,
    marginLeft: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 36,
    borderWidth: 2,
    borderColor: "#bfdbfe",
  },
  headerArea: {
    paddingHorizontal: 25,
    marginTop: 24,
    alignItems: "center",
  },
  title: {
    fontSize: theme.TYPOGRAPHY.h2.fontSize,
    fontWeight: theme.TYPOGRAPHY.h2.fontWeight,
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  formArea: {
    paddingHorizontal: theme.SPACING.containerPadding,
    marginTop: 24,
  },
  strengthArea: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.COLORS.border,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "700",
    width: 50,
    textAlign: "right",
  },
  requirementsArea: {
    marginTop: 10,
    gap: 6,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: theme.COLORS.textSecondary,
  },
  requirementMet: {
    color: theme.COLORS.success,
    fontWeight: "600",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  matchText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resetBtn: {
    marginTop: 32,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    color: theme.COLORS.textSecondary,
    fontSize: 15,
  },
  loginLink: {
    color: theme.COLORS.textLink,
    fontSize: 15,
    fontWeight: "700",
  },
});


