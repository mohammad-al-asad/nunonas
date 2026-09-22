// @ts-nocheck
import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

export default function HotelBookingSuccessScreen() {
  const router = useRouter();
  const {
    bookingRecordId,
    bookingCode,
    hotelName,
    hotelLocation,
    roomName,
    checkInDate,
    checkOutDate,
    nights,
    guests,
    totalAmount,
    estimatedPoints,
    promotionName,
  } = useLocalSearchParams();
  const formatDate = (value) => {
    if (!value) return "Not available";
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const viewBooking = () => {
    if (!bookingRecordId) {
      router.push("/profile/bookings");
      return;
    }
    router.push({
      pathname: "/profile/bookings/details",
      params: { id: String(bookingRecordId), category: "Hotel" },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Icon */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={60} color="white" />
          </View>
          <Text style={styles.successTitle}>Booking Request Sent</Text>
          <Text style={styles.successSubtitle}>
            The hotel will review and confirm your reservation.
          </Text>
        </View>

        {/* Booking ID */}
        <View style={styles.idCard}>
          <View>
            <Text style={styles.idLabel}>BOOKING ID</Text>
            <Text style={styles.idValue}>{bookingCode || "Pending"}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn}>
            <Ionicons
              name="copy-outline"
              size={20}
              color={theme.COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Hotel Summary */}
        <View style={styles.hotelCard}>
          <Image
            source={require("../../../../assets/images/discover-experience.png")}
            style={styles.hotelImage}
          />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{hotelName || "Hotel"}</Text>
            <Text style={styles.hotelLoc}>{hotelLocation || "Location unavailable"}</Text>
          </View>
        </View>

        {/* Stay Details */}
        <View style={styles.detailsBlock}>
          <Text style={styles.blockTitle}>Stay Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-in</Text>
            <Text style={styles.detailValue}>{formatDate(checkInDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out</Text>
            <Text style={styles.detailValue}>{formatDate(checkOutDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nights</Text>
            <Text style={styles.detailValue}>{nights || "1"} nights</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room</Text>
            <Text style={styles.detailValue}>{roomName || "Hotel Room"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>{guests || "1"} guests</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated total</Text>
            <Text style={styles.detailValue}>${Number(totalAmount || 0).toFixed(2)}</Text>
          </View>
          {promotionName ? <Text style={styles.promotionText}>{promotionName} applied</Text> : null}
          {Number(estimatedPoints || 0) > 0 ? (
            <Text style={styles.pointsText}>Earn approximately {estimatedPoints} points after completion</Text>
          ) : null}
        </View>

        {/* Important Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#1e3a8a" />
          <View style={styles.infoContent}>
            <Text style={styles.infoHeading}>Important Information</Text>
            <Text style={styles.infoText}>• Check-in time: 3:00 PM</Text>
            <Text style={styles.infoText}>
              • Cancellation is available while the booking is active
            </Text>
            <Text style={styles.infoText}>• Valid ID may be required at check-in</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={viewBooking}>
          <Text style={styles.primaryBtnText}>View My Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backHome}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.backHomeText}>Back to Home</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  idCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 25,
  },
  idLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.COLORS.textTertiary,
    letterSpacing: 1,
  },
  idValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginTop: 4,
  },
  copyBtn: {
    padding: 8,
    backgroundColor: theme.COLORS.white,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  hotelCard: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  hotelInfo: {
    justifyContent: "center",
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  hotelLoc: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    fontWeight: "600",
  },
  detailsBlock: {
    marginBottom: 30,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 15,
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    marginBottom: 30,
  },
  infoContent: {
    flex: 1,
  },
  infoHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#1e3a8a",
    marginBottom: 4,
  },
  primaryBtn: {
    backgroundColor: "#1e3a8a",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  primaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  backHome: {
    alignItems: "center",
    marginBottom: 40,
  },
  backHomeText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    fontWeight: "600",
  },
  nextTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  nextIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  nextItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  nextItemDesc: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginTop: 2,
  },
});


