// @ts-nocheck
import { Stack } from "expo-router";

export default function DiningLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}


