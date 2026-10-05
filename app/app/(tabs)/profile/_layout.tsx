// @ts-nocheck
import { Stack } from "expo-router";

// When another tab deep-links into a profile screen (e.g. booking details from Home),
// keep the profile page underneath so Back stays inside this tab.
export const unstable_settings = {
  initialRouteName: "index",
};

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="support" />
      <Stack.Screen name="legal" />
    </Stack>
  );
}


