// @ts-nocheck
import React, { useMemo, useState } from "react";
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
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { register as registerUser, verifyEmail as verifyEmailUser } from "../../lib/customer-api";
import { setSession } from "../../lib/auth-session";
import { clearPendingSignup, getPendingSignup } from "../../lib/pending-signup";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = useMemo(() => String(params.email ?? "").trim().toLowerCase(), [params.email]);
  const pendingSignup = useMemo(() => getPendingSignup(), []);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async () => {
    if (!email) {
      Alert.alert("Verification failed", "Missing email for verification.");
      return;
    }
    if (code.trim().length < 6) {
      Alert.alert("Invalid code", "Enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      const data = await verifyEmailUser({ email, otp: code.trim() });
      await setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? data.session_token,
      });
      clearPendingSignup();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Verification failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email || !pendingSignup?.fullName || !pendingSignup?.password) {
      Alert.alert("Cannot resend", "Missing registration details. Please sign up again.");
      return;
    }

    try {
      setResending(true);
      await registerUser({
        full_name: pendingSignup.fullName,
        gender: pendingSignup.gender || null,
        email,
        phone: pendingSignup.phone || null,
        password: pendingSignup.password,
        location_enabled: pendingSignup.locationEnabled ?? false,
        latitude: pendingSignup.latitude ?? null,
        longitude: pendingSignup.longitude ?? null,
        location_accuracy_meters: pendingSignup.locationAccuracyMeters ?? null,
      });
      Alert.alert("Code sent", "A new verification code was sent to your email.");
    } catch (error) {
      Alert.alert("Resend failed", error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={styles.email}>{email || "your email"}</Text>
            </Text>

            <InputField
              label="Verification Code"
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
              maxLength={6}
            />

            <Button
              title={loading ? "Verifying..." : "Verify Email"}
              onPress={verify}
              loading={loading}
              style={styles.primaryButton}
            />

            <TouchableOpacity onPress={resend} disabled={resending} style={styles.linkWrap}>
              <Text style={styles.linkText}>{resending ? "Resending..." : "Resend Code"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.backWrap}>
              <Text style={styles.backText}>Back</Text>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.SPACING.containerPadding,
  },
  card: {
    borderRadius: 24,
    backgroundColor: theme.COLORS.white,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  title: {
    fontSize: theme.TYPOGRAPHY.h2.fontSize,
    fontWeight: theme.TYPOGRAPHY.h2.fontWeight,
    color: theme.COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    color: theme.COLORS.textPrimary,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 24,
  },
  linkWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: theme.COLORS.textLink,
    fontSize: 14,
    fontWeight: "700",
  },
  backWrap: {
    marginTop: 14,
    alignItems: "center",
  },
  backText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
  },
});


