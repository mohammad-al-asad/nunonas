// @ts-nocheck
import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../../components/ui/Button";
import { Ionicons } from "@expo/vector-icons";

export default function SpaBookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    bookingRecordId,
    bookingCode,
    spaName,
    serviceName,
    dateTime,
    guests,
    totalAmount,
    estimatedPoints,
    promotionName,
  } = params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIconBox}>
          <Ionicons
            name="checkmark-circle"
            size={100}
            color={theme.COLORS.primary}
          />
        </View>

        <Text style={styles.title}>Booking Request Sent</Text>
        <Text style={styles.subtitle}>
          {spaName || "The spa"} will review and confirm your appointment.
        </Text>

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingCode || "Pending"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{serviceName || "Spa service"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {dateTime || "Saturday, Jan 24, 7:30 PM"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated total</Text>
            <Text style={styles.detailValue}>${Number(totalAmount || 0).toFixed(2)}</Text>
          </View>
          {promotionName ? <Text style={styles.promotionText}>{promotionName} applied</Text> : null}
          {Number(estimatedPoints || 0) > 0 ? <Text style={styles.pointsText}>Earn approximately {estimatedPoints} points after completion</Text> : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>{guests || "4"} People</Text>
          </View>
        </View>

        <Button
          title="Back to Home"
          onPress={() => router.push("/home")}
          style={styles.homeButton}
        />

        <Button
          title="View My Bookings"
          onPress={() => {
            if (!bookingRecordId) {
              router.push("/profile/bookings");
              return;
            }
            router.push({
              pathname: "/profile/bookings/details",
              params: { id: String(bookingRecordId), category: "Spa" },
            });
          }}
          variant="outline"
          style={styles.bookingsButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconBox: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  detailsBox: {
    width: "100%",
    backgroundColor: theme.COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  promotionText: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  pointsText: {
    color: "#a16207",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  homeButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
  },
  bookingsButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
  },
});


