// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { login as loginUser, socialLogin } from "../../lib/customer-api";
import { setSession } from "../../lib/auth-session";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

const isGoogleConfigured = Boolean(
  Platform.select({
    ios: GOOGLE_IOS_CLIENT_ID,
    android: GOOGLE_ANDROID_CLIENT_ID,
    default: GOOGLE_WEB_CLIENT_ID,
  }) || GOOGLE_WEB_CLIENT_ID
);

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || "disabled-web-client-id",
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || "disabled-android-client-id",
    iosClientId: GOOGLE_IOS_CLIENT_ID || "disabled-ios-client-id",
    responseType: "id_token",
    scopes: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    selectAccount: true,
  });

  useEffect(() => {
    if (googleResponse?.type !== "success") {
      if (googleResponse?.type === "error") {
        Alert.alert(
          "Google sign-in failed",
          googleResponse.error?.message || "Google rejected the sign-in request."
        );
      }
      return;
    }

    const idToken =
      googleResponse.authentication?.idToken ||
      googleResponse.params?.id_token;

    if (!idToken) {
      Alert.alert("Google sign-in failed", "Google did not return an ID token.");
      return;
    }

    let active = true;

    async function finishGoogleLogin() {
      try {
        setLoading(true);
        const data = await socialLogin({
          provider: "google",
          id_token: idToken,
        });
        if (!active) {
          return;
        }
        await setSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? data.session_token,
        });
        router.replace("/(tabs)");
      } catch (error) {
        if (active) {
          Alert.alert("Google sign-in failed", error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    finishGoogleLogin();

    return () => {
      active = false;
    };
  }, [googleResponse, router]);

  const handleSocialPress = (provider) => {
    Alert.alert(
      `${provider} sign-in unavailable`,
      "Apple sign-in is not configured yet in the backend. Use email, phone, or Google login for now."
    );
  };

  const handleGooglePress = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        "Google sign-in unavailable",
        "Google sign-in is not configured yet. Please configure EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (or iOS/Web client ID) in your .env file."
      );
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (error) {
      Alert.alert("Google sign-in failed", error?.message || "An error occurred during Google sign-in.");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing credentials", "Enter your email or phone and password.");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser({
        email_or_phone: email.trim(),
        password,
      });
      await setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? data.session_token,
      });
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Login failed", error.message);
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
          {/* Header Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/welcome-back.png")}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Title Area */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login to continue discovering experiences near you.
            </Text>
          </View>

          {/* Form Area */}
          <View style={styles.formArea}>
            <InputField
              label="Email or Phone Number"
              placeholder="Enter your email or phone"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push("/auth/forgot-password")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title={loading ? "Logging In..." : "Login"}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

            <View style={styles.dividerArea}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialArea}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGooglePress}
                disabled={!googleRequest || loading}
              >
                <Ionicons
                  name="logo-google"
                  size={24}
                  color={theme.COLORS.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialPress("Apple")}
              >
                <Ionicons
                  name="logo-apple"
                  size={24}
                  color={theme.COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/signup")}>
                <Text style={styles.signUpText}>Sign Up</Text>
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
    paddingBottom: 40,
  },
  imageContainer: {
    height: 220,
    backgroundColor: theme.COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 24,
    marginTop: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  headerArea: {
    paddingHorizontal: 25,
    marginTop: 30,
    alignItems: "center",
  },
  title: {
    fontSize: theme.TYPOGRAPHY.h2.fontSize,
    fontWeight: theme.TYPOGRAPHY.h2.fontWeight,
    color: theme.COLORS.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: theme.TYPOGRAPHY.subtitle.fontSize,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    lineHeight: theme.TYPOGRAPHY.subtitle.lineHeight,
  },
  formArea: {
    paddingHorizontal: theme.SPACING.containerPadding,
    marginTop: 15,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  forgotText: {
    color: theme.COLORS.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  loginBtn: {
    marginTop: 30,
  },
  dividerArea: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.COLORS.divider,
  },
  dividerText: {
    marginHorizontal: 15,
    color: theme.COLORS.textSecondary,
    fontSize: 14,
  },
  socialArea: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    gap: 20,
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
  },
  footer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  footerText: {
    color: theme.COLORS.textSecondary,
    fontSize: 15,
  },
  signUpText: {
    color: theme.COLORS.textLink,
    fontSize: 15,
    fontWeight: "700",
  },
});


