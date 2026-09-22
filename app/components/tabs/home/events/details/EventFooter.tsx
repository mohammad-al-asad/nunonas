import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import type { NormalizedMapEvent } from "../../../../../lib/event-map-types";

const AVATARS = [
  "https://i.pravatar.cc/100?u=1",
  "https://i.pravatar.cc/100?u=2",
  "https://i.pravatar.cc/100?u=3",
];

type BookingState = {
  loading: boolean;
  code: string;
};

type EventFooterProps = {
  event: NormalizedMapEvent;
  quantity?: number;
  onChangeQuantity: (value: number) => void;
  onBook: () => void;
  booking: BookingState;
};

export default function EventFooter({
  event,
  quantity = 1,
  onChangeQuantity,
  onBook,
  booking,
}: EventFooterProps) {
  const attendeeText =
    typeof event?.capacity === "number"
      ? `${event.capacity}+ spots available`
      : "+1,244 others attending";
  const ratingText = event?.rating != null ? String(event.rating) : "4.8";
  const reviewCount = event?.reviewsCount != null ? `(${event.reviewsCount})` : "(324)";
  const bookingLabel = booking?.loading
    ? "Booking..."
    : booking?.code
      ? `Booked ${booking.code}`
      : !event.registrationOpen
        ? "Registration closed"
      : "Book Ticket";

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.attendeesContainer}>
          <View style={styles.avatarStack}>
            {AVATARS.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={[styles.avatar, { marginLeft: index === 0 ? 0 : -10 }]}
              />
            ))}
          </View>
          <Text style={styles.attendeeText}>{attendeeText}</Text>
        </View>

        <View style={styles.ratingBox}>
          <Ionicons name="star" size={18} color="#f59e0b" />
          <Text style={styles.ratingText}>{ratingText}</Text>
          <Text style={styles.reviewCount}>{reviewCount}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.quantityCard}>
          <Text style={styles.quantityLabel}>Tickets</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => onChangeQuantity?.(Math.max(1, quantity - 1))}
              disabled={booking?.loading || !event.registrationOpen}
            >
              <Ionicons name="remove" size={16} color={theme.COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => onChangeQuantity?.(Math.min(20, quantity + 1))}
              disabled={booking?.loading || !event.registrationOpen}
            >
              <Ionicons name="add" size={16} color={theme.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.bookButton,
            booking?.code ? styles.bookedButton : null,
            !event.registrationOpen ? styles.disabledButton : null,
          ]}
          onPress={onBook}
          activeOpacity={0.85}
          disabled={booking?.loading || !event.registrationOpen}
        >
          {booking?.loading ? (
            <ActivityIndicator color={theme.COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name="ticket-outline" size={18} color={theme.COLORS.white} />
              <Text style={styles.bookButtonText}>{bookingLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: theme.COLORS.white,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.COLORS.white,
  },
  attendeeText: {
    fontSize: 13,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: 13,
    color: theme.COLORS.textSecondary,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityCard: {
    width: 110,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.white,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  bookButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...theme.SHADOWS.primary,
  },
  bookedButton: {
    backgroundColor: "#16a34a",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  bookButtonText: {
    color: theme.COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});


