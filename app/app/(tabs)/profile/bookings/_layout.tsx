// @ts-nocheck
import { Stack } from "expo-router";

// Opening booking details directly (e.g. from Home) puts the bookings list underneath it.
export const unstable_settings = {
  initialRouteName: "index",
};

export default function BookingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
    </Stack>
  );
}


