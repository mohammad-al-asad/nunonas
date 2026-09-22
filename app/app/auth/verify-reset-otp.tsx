// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import { forgotPassword, verifyOtp } from "../../lib/customer-api";
import { setPendingResetToken } from "../../lib/pending-reset";

const OTP_LENGTH = 6;

export default function VerifyResetOtpScreen() {
  const { email } = useLocalSearchParams();
  const router = useRouter();

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    // Allow only digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const next = [...otp];
        next[index - 1] = "";
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      Alert.alert("Incomplete Code", "Please enter the full 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const result = await verifyOtp(email, code);
      const resetToken = result?.reset_token;
      if (!resetToken) {
        throw new Error("Reset token was not returned.");
      }
      setPendingResetToken(resetToken);
      router.push({
        pathname: "/auth/reset-password",
        params: { email },
      });
    } catch (error) {
      Alert.alert("Invalid Code", error.message || "The code is incorrect or expired.");
      // Clear OTP on failure
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      await forgotPassword(email);
      setPendingResetToken(null);
      setOtp(Array(OTP_LENGTH).fill(""));
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, "$1****$2")
    : "your email";

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
            <Ionicons name="mail-open-outline" size={40} color={theme.COLORS.primary} />
          </View>

          {/* Header */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to{"\n"}
              <Text style={styles.emailHighlight}>{maskedEmail}</Text>
            </Text>
          </View>

          {/* OTP Input Grid */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  index === otp.findLastIndex((d) => d !== "") + 1 ? styles.otpBoxActive : null,
                ]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Verify Button */}
          <View style={styles.btnArea}>
            <Button
              title={loading ? "Verifying..." : "Verify Code"}
              onPress={handleVerify}
              loading={loading}
              disabled={otp.join("").length < OTP_LENGTH}
            />
          </View>

          {/* Resend */}
          <View style={styles.resendArea}>
            {canResend ? (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendLoading}
              >
                <Text style={styles.resendLink}>
                  {resendLoading ? "Sending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Resend code in{" "}
                <Text style={styles.timerCount}>{countdown}s</Text>
              </Text>
            )}
          </View>

          {/* Back to login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
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
  emailHighlight: {
    color: theme.COLORS.primary,
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 36,
    paddingHorizontal: 20,
  },
  otpBox: {
    width: 50,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.surface,
    fontSize: 22,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: theme.COLORS.primary,
    backgroundColor: "#eff6ff",
  },
  otpBoxActive: {
    borderColor: theme.COLORS.secondary,
  },
  btnArea: {
    paddingHorizontal: 25,
    marginTop: 32,
  },
  resendArea: {
    marginTop: 24,
    alignItems: "center",
  },
  resendTimer: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  timerCount: {
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textLink,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
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


