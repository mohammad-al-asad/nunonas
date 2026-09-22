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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { forgotPassword } from "../../lib/customer-api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(trimmed);
      router.push({
        pathname: "/auth/verify-reset-otp",
        params: { email: trimmed },
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send reset code. Please try again.");
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
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.COLORS.textPrimary}
            />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View style={styles.iconBadge}>
            <Ionicons name="lock-closed-outline" size={40} color={theme.COLORS.primary} />
          </View>

          {/* Header */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your registered email address and we'll send you a 6-digit
              verification code to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formArea}>
            <InputField
              label="Email Address"
              iconName="mail-outline"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Button
              title={loading ? "Sending Code..." : "Send Reset Code"}
              onPress={handleSendOtp}
              loading={loading}
              style={styles.sendBtn}
            />

            {/* Divider */}
            <View style={styles.dividerArea}>
              <View style={styles.divider} />
            </View>

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
    marginTop: 32,
  },
  sendBtn: {
    marginTop: 28,
  },
  dividerArea: {
    marginTop: 32,
    marginBottom: 20,
    alignItems: "center",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: theme.COLORS.divider,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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


