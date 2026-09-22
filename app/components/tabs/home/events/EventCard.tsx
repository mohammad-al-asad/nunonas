import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import type { NormalizedMapEvent } from "../../../../lib/event-map-types";

type EventCardProps = {
  event: NormalizedMapEvent;
};

export default function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const imageSource = event.imageUrl ? { uri: event.imageUrl } : null;
  const tagColor = event.currentBookingCode ? "#16a34a" : theme.COLORS.primary;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="calendar" size={42} color={theme.COLORS.primary} />
            <Text style={styles.imagePlaceholderText}>Event banner unavailable</Text>
          </View>
        )}
        {event.tag ? (
          <View
            style={[
              styles.tag,
              { backgroundColor: tagColor },
            ]}
          >
            <Text style={styles.tagText}>{event.tag}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.COLORS.textSecondary}
          />
          <Text style={styles.infoText}>
            {[event.date, event.time].filter(Boolean).join(" - ")}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.COLORS.textSecondary}
          />
          <Text style={styles.infoText}>
            {[event.location, event.distance ? `${event.distance} away` : ""]
              .filter(Boolean)
              .join(" - ")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.push(`/home/events/${event.id}`)}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  imageContainer: {
    height: 200,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  imagePlaceholderText: {
    marginTop: 6,
    color: theme.COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  providerImage: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#ffffff",
    backgroundColor: "#e2e8f0",
  },
  tag: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    color: theme.COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  button: {
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: theme.COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});


