import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import type { NormalizedMapEvent } from "../../../../../lib/event-map-types";

type InfoItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"] | React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  subtitle: string;
  IconComponent?: typeof Ionicons | typeof MaterialCommunityIcons;
};

type EventKeyInfoProps = {
  event: NormalizedMapEvent;
};

const InfoItem = ({ icon, title, subtitle, IconComponent = Ionicons }: InfoItemProps) => (
  <View style={styles.itemContainer}>
    <View style={styles.iconBox}>
      <IconComponent name={icon as never} size={22} color={theme.COLORS.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

export default function EventKeyInfo({ event }: EventKeyInfoProps) {
  const locationSubtitle = [event?.venue, event?.distance ? `${event.distance} away` : ""]
    .filter(Boolean)
    .join(" - ");
  const attendanceTitle =
    typeof event?.capacity === "number" ? `${event.capacity} capacity` : "Event access";
  const attendanceSubtitle =
    event?.ticketPrice != null ? `Tickets from ${event.ticketPrice}` : "Check event details";

  return (
    <View style={styles.container}>
      <InfoItem
        icon="calendar"
        title={event?.date || "Saturday, March 23"}
        subtitle={event?.time || "8:00 PM - 2:00 AM"}
      />

      {event.registrationDeadline ? (
        <InfoItem
          icon="time-outline"
          title={`Registration ${event.registrationOpen ? "closes" : "closed"}`}
          subtitle={new Date(
            `${event.registrationDeadline.slice(0, 10)}T00:00:00`,
          ).toLocaleDateString()}
        />
      ) : null}

      <InfoItem
        icon="location-outline"
        title={event?.location || "Event location unavailable"}
        subtitle={locationSubtitle || "Venue available"}
      />

      <InfoItem
        icon="account-group-outline"
        IconComponent={MaterialCommunityIcons}
        title={attendanceTitle}
        subtitle={attendanceSubtitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    gap: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
});


