// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { register as registerUser, socialLogin } from "../../lib/customer-api";
import { setSession } from "../../lib/auth-session";
import { setPendingSignup } from "../../lib/pending-signup";

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

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enableLocation, setEnableLocation] = useState(false);
  const [signupLocation, setSignupLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
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
          "Google sign-up failed",
          googleResponse.error?.message || "Google rejected the sign-in request."
        );
      }
      return;
    }

    const idToken =
      googleResponse.authentication?.idToken ||
      googleResponse.params?.id_token;

    if (!idToken) {
      Alert.alert("Google sign-up failed", "Google did not return an ID token.");
      return;
    }

    let active = true;

    async function finishGoogleSignup() {
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
          Alert.alert("Google sign-up failed", error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    finishGoogleSignup();

    return () => {
      active = false;
    };
  }, [googleResponse, router]);

  const handleSocialPress = (provider) => {
    Alert.alert(
      `${provider} sign-up unavailable`,
      "Apple sign-in is not configured yet in the backend. Use the form flow or Google sign-in for now."
    );
  };

  const handleGooglePress = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        "Google sign-up unavailable",
        "Google sign-up is not configured yet. Please configure EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (or iOS/Web client ID) in your .env file."
      );
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (error) {
      Alert.alert("Google sign-up failed", error?.message || "An error occurred during Google sign-in.");
    }
  };

  const getLocationStatusMessage = (errorMessage) => {
    const message = String(errorMessage || "").toLowerCase();

    if (message.includes("location services") || message.includes("current location is unavailable")) {
      return "Location services are off. You can still sign up without location.";
    }
    if (message.includes("permission")) {
      return "Location permission was not granted. You can still sign up without location.";
    }

    return "Couldn't get your location right now. You can still sign up without location.";
  };

  const handleLocationToggle = async (nextValue) => {
    setEnableLocation(nextValue);

    if (!nextValue) {
      setLocationLoading(false);
      setSignupLocation(null);
      setLocationStatus("");
      return;
    }

    try {
      setLocationLoading(true);
      setLocationStatus("");
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setEnableLocation(false);
        setSignupLocation(null);
        setLocationStatus("Location services are off. You can still sign up without location.");
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setEnableLocation(false);
        setSignupLocation(null);
        setLocationStatus("Location permission was not granted. You can still sign up without location.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setSignupLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location_accuracy_meters: position.coords.accuracy ?? null,
      });
      setLocationStatus("Location captured for nearby recommendations.");
    } catch (error) {
      setEnableLocation(false);
      setSignupLocation(null);
      setLocationStatus(getLocationStatusMessage(error?.message));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!fullName.trim()) {
      Alert.alert("Missing name", "Enter your full name.");
      return;
    }
    if (!normalizedEmail) {
      Alert.alert("Missing email", "Enter your email address.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Password and confirm password must match.");
      return;
    }
    if (enableLocation && locationLoading) {
      Alert.alert("Location in progress", "Wait for your location to finish loading, then submit.");
      return;
    }
    if (enableLocation && !signupLocation) {
      Alert.alert("Location missing", "Turn location on again to capture your current location.");
      return;
    }

    try {
      setLoading(true);
      await registerUser({
        full_name: fullName.trim(),
        gender: gender || null,
        email: normalizedEmail,
        phone: normalizedPhone || null,
        password,
        location_enabled: enableLocation,
        latitude: signupLocation?.latitude ?? null,
        longitude: signupLocation?.longitude ?? null,
        location_accuracy_meters: signupLocation?.location_accuracy_meters ?? null,
      });
      setPendingSignup({
        fullName: fullName.trim(),
        gender,
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        locationEnabled: enableLocation,
        latitude: signupLocation?.latitude ?? null,
        longitude: signupLocation?.longitude ?? null,
        locationAccuracyMeters: signupLocation?.location_accuracy_meters ?? null,
      });
      router.push({
        pathname: "/auth/verify-email",
        params: {
          email: normalizedEmail,
        },
      });
    } catch (error) {
      Alert.alert("Registration failed", error.message);
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
              source={require("../../assets/images/create-account.png")}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Title Area */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join us to book, save, and earn rewards.
            </Text>
          </View>

          {/* Form Area */}
          <View style={styles.formArea}>
            <InputField
              label="Full Name"
              placeholder="John Doe"
              iconName="person-outline"
              value={fullName}
              onChangeText={setFullName}
            />

            <InputField
              label="Email Address"
              placeholder="you@example.com"
              iconName="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <InputField
              label="Phone Number"
              placeholder="+8801712345678"
              iconName="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.genderArea}>
              <Text style={styles.genderLabel}>Gender <Text style={styles.optionalLabel}>(Optional)</Text></Text>
              <View style={styles.genderOptions}>
                {[['female', 'Female'], ['male', 'Male'], ['other', 'Other'], ['prefer_not_to_say', 'Prefer not to say']].map(([value, label]) => (
                  <TouchableOpacity key={value} onPress={() => setGender(value)} style={[styles.genderOption, gender === value && styles.selectedGenderOption]}>
                    <Text style={[styles.genderText, gender === value && styles.selectedGenderText]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <InputField
              label="Password"
              placeholder="••••••••"
              iconName="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <InputField
              label="Confirm Password"
              placeholder="••••••••"
              iconName="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            {/* Location Toggle */}
            <View style={styles.locationArea}>
              <View style={styles.locationInfo}>
                <Ionicons
                  name="location"
                  size={24}
                  color={theme.COLORS.primary}
                />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationTitle}>Enable location</Text>
                  <Text style={styles.locationSubtitle}>
                    {locationLoading
                      ? "Finding your current location..."
                      : enableLocation
                        ? locationStatus || "Location captured for nearby recommendations"
                        : "Get better recommendations"}
                  </Text>
                  {!enableLocation && locationStatus ? (
                    <Text style={styles.locationErrorText}>{locationStatus}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.locationControl}>
                {locationLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.COLORS.primary}
                    style={styles.locationSpinner}
                  />
                ) : null}
                <Switch
                  value={enableLocation}
                  onValueChange={handleLocationToggle}
                  trackColor={{
                    false: theme.COLORS.border,
                    true: theme.COLORS.primary,
                  }}
                  thumbColor={
                    Platform.OS === "ios"
                      ? theme.COLORS.white
                      : enableLocation
                        ? theme.COLORS.white
                        : "#f4f3f4"
                  }
                />
              </View>
            </View>

            <Button
              title={loading ? "Creating Account..." : "Create Account"}
              onPress={handleSignup}
              loading={loading}
              style={styles.createBtn}
            />

            <View style={styles.dividerArea}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or sign up with</Text>
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
                  color={theme.COLORS.primary}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialPress("Apple")}
              >
                <Ionicons
                  name="logo-apple"
                  size={24}
                  color={theme.COLORS.primary}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={styles.loginText}>Login</Text>
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
    height: 180,
    backgroundColor: "#fef2f2",
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
    marginTop: 25,
    alignItems: "center",
  },
  title: {
    fontSize: theme.TYPOGRAPHY.h2.fontSize,
    fontWeight: theme.TYPOGRAPHY.h2.fontWeight,
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  formArea: {
    paddingHorizontal: theme.SPACING.containerPadding,
    marginTop: 10,
  },
  locationArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  genderArea: {
    marginTop: 18,
  },
  genderLabel: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  optionalLabel: {
    fontWeight: "500",
    color: theme.COLORS.textSecondary,
  },
  genderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderOption: {
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedGenderOption: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  genderText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
  },
  selectedGenderText: {
    color: theme.COLORS.white,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 12,
  },
  locationControl: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  locationSpinner: {
    marginRight: 10,
  },
  locationTitle: {
    fontSize: theme.TYPOGRAPHY.label.fontSize,
    fontWeight: theme.TYPOGRAPHY.label.fontWeight,
    color: "#1e293b",
  },
  locationSubtitle: {
    fontSize: 13,
    color: theme.COLORS.textSecondary,
  },
  locationErrorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#b45309",
  },
  createBtn: {
    marginTop: 25,
  },
  dividerArea: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.COLORS.divider,
  },
  dividerText: {
    marginHorizontal: 15,
    color: theme.COLORS.textSecondary,
    fontSize: 13,
  },
  socialArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 15,
  },
  socialBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  footer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  footerText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
  },
  loginText: {
    color: theme.COLORS.textLink,
    fontSize: 14,
    fontWeight: "700",
  },
});


