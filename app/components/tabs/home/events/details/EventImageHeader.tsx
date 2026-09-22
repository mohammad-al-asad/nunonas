import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../../constants/theme";
import type { NormalizedMapEvent } from "../../../../../lib/event-map-types";

type EventImageHeaderProps = {
  event: NormalizedMapEvent;
  saved: boolean;
  saving: boolean;
  onToggleSaved: () => void;
};

export default function EventImageHeader({ event, saved, saving, onToggleSaved }: EventImageHeaderProps) {
  const router = useRouter();
  const imageSource = event.imageUrl
    ? { uri: event.imageUrl }
    : require("../../../../../assets/images/events.webp");

  return (
    <ImageBackground source={imageSource} style={styles.container}>
      <View style={styles.overlay} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onToggleSaved} disabled={saving}>
          <Ionicons name={saved ? "heart" : "heart-outline"} size={24} color={saved ? "#ef4444" : theme.COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.title}>
          {event?.title || "Electronic Music Festival 2026"}
        </Text>
        <Text style={styles.tagline}>
          {event?.tag || event?.eventType || "Live Event"}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 350,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomInfo: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.COLORS.white,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
});


