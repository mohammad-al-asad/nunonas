// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import theme from "../../constants/theme";

// Pulsing placeholder shape. Size it with `style` (width/height/borderRadius).
export default function SkeletonBlock({ style }) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: theme.COLORS.border, borderRadius: 8 },
});
