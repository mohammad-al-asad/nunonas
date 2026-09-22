import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import theme from "../../constants/theme";
import { registerToastHandler, type ToastType } from "../../lib/toast";

type ToastState = { message: string; type: ToastType } | null;

export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    registerToastHandler((message, options) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type: options?.type ?? "info" });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setToast(null);
        });
      }, options?.duration ?? 2600);
    });

    return () => {
      registerToastHandler(null);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!toast) return null;

  return (
    <Animated.View style={[styles.container, { top: insets.top + 10, opacity }]} pointerEvents="none">
      <View style={[styles.toast, toast.type === "success" ? styles.success : toast.type === "error" ? styles.error : styles.info]}>
        <Text style={styles.message}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: 16, right: 16, zIndex: 9999, alignItems: "center" },
  toast: { maxWidth: "100%", minHeight: 44, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, ...theme.SHADOWS.card },
  success: { backgroundColor: "#15803d" },
  error: { backgroundColor: "#b91c1c" },
  info: { backgroundColor: "#1e3a8a" },
  message: { color: "#ffffff", fontSize: 13, fontWeight: "700", textAlign: "center" },
});
