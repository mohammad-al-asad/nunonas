// @ts-nocheck
import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Alert, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../../components/ui/Button";
import PageHeader from "../../../../components/ui/PageHeader";
import {
  bookRestaurantTable,
  getBookingQuote,
  getRestaurant,
} from "../../../../lib/customer-api";
import { getFirstQueryParam, getErrorMessage } from "../../../../lib/event-map-utils";
import { normalizeRestaurant } from "../../../../lib/provider-utils";
import { showToast } from "../../../../lib/toast";

// Import Modular Components
import ConfirmSummaryCard from "../../../../components/tabs/home/dining/details/booking/confirm_booking/ConfirmSummaryCard";
import ConfirmationDetails from "../../../../components/tabs/home/dining/details/booking/confirm_booking/ConfirmationDetails";
import ConfirmNotes from "../../../../components/tabs/home/dining/details/booking/confirm_booking/ConfirmNotes";
import PromoCodeInput from "../../../../components/ui/PromoCodeInput";

export default function ConfirmBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { id, date, time, guests, notes, seating } = params;
  const restaurantId = getFirstQueryParam(id);
  const [specialNotes, setSpecialNotes] = useState(typeof notes === "string" ? notes : "");
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurant() {
      if (!restaurantId) {
        setError("Restaurant not found.");
        setLoading(false);
        return;
      }

      try {
        const payload = await getRestaurant(restaurantId);
        if (!cancelled) {
          const normalized = normalizeRestaurant(payload);
          setRestaurant({
            title: normalized.title,
            location: normalized.locationText,
            distance: normalized.distanceText,
            rating: normalized.ratingText,
            reviews: normalized.reviewsText,
            image: normalized.imageUrl
              ? { uri: normalized.imageUrl }
              : require("../../../../assets/images/discover-experience.png"),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Failed to load restaurant."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRestaurant();

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const loadQuote = async (code = promoCode) => {
    if (!restaurantId || !date || !time) return null;
    setQuoteLoading(true);
    setPromoError("");
    try {
      const nextQuote = await getBookingQuote({
        provider_id: restaurantId,
        provider_type: "restaurant",
        date: String(date),
        time: String(time),
        guests: Number(guests || 1),
        seating_preference: String(seating || "No preference"),
        special_notes: specialNotes,
        promo_code: code.trim() || undefined,
      });
      setQuote(nextQuote);
      return nextQuote;
    } catch (quoteError) {
      setPromoError(getErrorMessage(quoteError, "Could not calculate this booking."));
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    void loadQuote("");
  }, [restaurantId, date, time, guests, seating]);

  const handleBack = () => {
    router.back();
  };

  const buildBookingDate = (value) => String(value || "");

  const handleConfirm = async () => {
    if (!restaurantId || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await bookRestaurantTable(restaurantId, {
        date: buildBookingDate(date),
        time: String(time || "7:30 PM"),
        guests: Number(guests || 4),
        seating_preference: String(seating || "Outdoor"),
        special_notes: specialNotes,
        auto_confirm: false,
        promo_code: promoCode.trim() || undefined,
      });

      const bookingRecordId = response?.id ?? response?.booking_id ?? "";
      const bookingCode = response?.booking_code ?? response?.bookingCode ?? "";
      router.replace({
        pathname: "/(tabs)/home/dining/booking_success",
        params: {
          id: restaurantId,
          restaurantName: restaurant?.title ?? "Restaurant",
          dateTime: `${displayDate} at ${displayTime}`,
          guests: displayGuests,
          seating: displaySeating,
          bookingRecordId: String(bookingRecordId),
          bookingCode: String(bookingCode),
          promotionName: String(response?.promotion_name ?? quote?.promotion_name ?? ""),
        }
      });
    } catch (error) {
        showToast(getErrorMessage(error, "Could not confirm restaurant booking."), { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  // Built by hand: Android's Intl ignores the options and prints the phone locale's format ("sábado, 7/11/2026").
  const displayDate = (() => {
    const parsed = date ? new Date(`${date}T12:00:00`) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return "";
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${weekdays[parsed.getDay()]}, ${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
  })();
  const displayTime = time || "";
  const displayGuests = guests || "2";
  const displaySeating = seating || "Outdoor";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Booking Summary" onBack={handleBack} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Booking Summary" onBack={handleBack} />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || "Restaurant not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Booking Summary" onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ConfirmSummaryCard restaurant={restaurant} />
        
        <ConfirmationDetails 
          date={displayDate}
          time={displayTime}
          guests={displayGuests}
          seating={displaySeating}
        />
        
        <ConfirmNotes notes={specialNotes} onNotesChange={setSpecialNotes} />

        <PromoCodeInput
          value={promoCode}
          onChange={(value) => { setPromoCode(value); setPromoError(""); }}
          onApply={() => void loadQuote(promoCode)}
          loading={quoteLoading}
          appliedPromotion={quote?.promotion_name}
          error={promoError}
        />

        {/* No price summary: a table booking is paid at the restaurant, for whatever the guests order. */}
        <View style={styles.payAtVenue}>
          <Text style={styles.payAtVenueText}>
            No payment now. You pay at the restaurant for what you order
            {quote?.promotion_name ? `, and ${quote.promotion_name} is applied to your bill.` : "."}
          </Text>
        </View>

        <Button
          title="Send Booking Request"
          onPress={handleConfirm}
          loading={submitting}
          disabled={submitting || quoteLoading || !quote}
          style={styles.confirmButton}
          textStyle={styles.confirmButtonText}
        />
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
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  payAtVenue: {
    marginVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.COLORS.surface,
    padding: 14,
  },
  payAtVenueText: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 10,
  },
  confirmButtonText: {
    textTransform: "capitalize",
  },
});


