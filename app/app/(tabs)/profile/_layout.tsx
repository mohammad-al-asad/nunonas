// @ts-nocheck
import { Stack } from "expo-router";

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


