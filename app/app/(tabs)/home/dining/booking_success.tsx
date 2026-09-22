// @ts-nocheck
import React from "react";
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../../components/ui/Button";
import { Ionicons } from "@expo/vector-icons";

// Import Modular Components
import SuccessHeader from "../../../../components/tabs/home/dining/details/booking/confirm_booking/confirmed/SuccessHeader";
import ConfirmedDetailsCard from "../../../../components/tabs/home/dining/details/booking/confirm_booking/confirmed/ConfirmedDetailsCard";
import PointsBanner from "../../../../components/tabs/home/dining/details/booking/confirm_booking/confirmed/PointsBanner";

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const {
    restaurantName,
    dateTime,
    guests,
    seating,
    bookingRecordId,
    bookingCode,
    estimatedPoints,
    totalAmount,
    promotionName,
  } = params;

  const handleBackToHome = () => {
    router.replace("/(tabs)/home");
  };

  const handleViewBooking = () => {
    if (!bookingRecordId) {
      router.push("/profile/bookings");
      return;
    }
    router.push({
      pathname: "/profile/bookings/details",
      params: { id: String(bookingRecordId), category: "Restaurant" },
    });
  };

  const details = {
    restaurantName: restaurantName || "Restaurant",
    dateTime: dateTime || "Date pending",
    guests: guests || "1",
    seating: seating || "No preference",
    bookingId: bookingCode || "Pending",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SuccessHeader />
        
        <ConfirmedDetailsCard details={details} />
        
        {Number(estimatedPoints || 0) > 0 ? (
          <PointsBanner points={Number(estimatedPoints)} />
        ) : null}

        {promotionName ? <Text style={styles.promotionText}>{promotionName} was applied.</Text> : null}
        {Number(totalAmount || 0) > 0 ? <Text style={styles.totalText}>Estimated total: ${Number(totalAmount).toFixed(2)}</Text> : null}

        <Button
          title="View My Booking"
          onPress={handleViewBooking}
          style={styles.viewButton}
        />

        <TouchableOpacity onPress={handleBackToHome} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>You can reschedule or cancel from your profile.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  viewButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.COLORS.primary,
  },
  homeLink: {
    paddingVertical: 20,
    alignItems: "center",
  },
  homeLinkText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    flex: 1,
  },
  promotionText: {
    color: "#15803d",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  totalText: {
    color: theme.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },
});


