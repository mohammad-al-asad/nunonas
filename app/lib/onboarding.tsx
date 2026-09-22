// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_SEEN_STORAGE_KEY = "nuno_onboarding_seen";

export async function hasSeenOnboarding() {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen() {
  await AsyncStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, "true");
}


