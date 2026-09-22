// @ts-nocheck
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import theme from "../../constants/theme";
import { restoreSession } from "../../lib/auth-session";

export default function AuthGate({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const session = await restoreSession();

      if (cancelled) {
        return;
      }

      setStatus(session?.accessToken ? "authorized" : "unauthorized");
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
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

  if (status === "unauthorized") {
    return <Redirect href="/auth/login" />;
  }

  return children;
}


