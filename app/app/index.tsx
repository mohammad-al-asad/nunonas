// @ts-nocheck
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import theme from "../constants/theme";
import { restoreSession } from "../lib/auth-session";
import { hasSeenOnboarding } from "../lib/onboarding";

export default function Index() {
  const [targetRoute, setTargetRoute] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveInitialRoute() {
      const [seenOnboarding, session] = await Promise.all([
        hasSeenOnboarding(),
        restoreSession(),
      ]);

      if (cancelled) {
        return;
      }

      if (!seenOnboarding) {
        setTargetRoute("/onboarding");
        return;
      }

      if (session?.accessToken) {
        setTargetRoute("/(tabs)");
        return;
      }

      setTargetRoute("/auth/login");
    }

    resolveInitialRoute();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!targetRoute) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.COLORS.white,
        }}
      >
        <ActivityIndicator size="small" color={theme.COLORS.primary} />
      </View>
    );
  }

  return <Redirect href={targetRoute} />;
}


