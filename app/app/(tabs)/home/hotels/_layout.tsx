// @ts-nocheck
import { Stack } from "expo-router";

export default function HotelLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="booking_success" />
      <Stack.Screen name="room/[id]" />
    </Stack>
  );
}


