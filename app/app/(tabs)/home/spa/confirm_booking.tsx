// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../../components/ui/Button";
import PageHeader from "../../../../components/ui/PageHeader";
import { bookSpa, getSpa, getSpaBookingQuote } from "../../../../lib/customer-api";
import { getErrorMessage, normalizeSpa } from "../../../../lib/provider-utils";
import { showToast } from "../../../../lib/toast";

// Import Modular Components
import SpaSummary from "../../../../components/tabs/home/spa/details/booking/SpaSummary";
import SpaBookingDetails from "../../../../components/tabs/home/spa/details/booking/SpaBookingDetails";
import SpaSpecialNotes from "../../../../components/tabs/home/spa/details/booking/SpaSpecialNotes";
import BookingPriceSummary from "../../../../components/ui/BookingPriceSummary";
import PromoCodeInput from "../../../../components/ui/PromoCodeInput";

export default function SpaConfirmBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { id, date, time, guests, notes, serviceId } = params;
  const [spa, setSpa] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");

  const handleBack = () => {
    router.back();
  };

  const loadQuote = async (code = promoCode) => {
    if (!id || !date || !time) return null;
    setQuoteLoading(true);
    setPromoError("");
    try {
      const nextQuote = await getSpaBookingQuote(String(id), {
        date: String(date),
        time: String(time),
        guests: Number(guests || 1),
        service_id: serviceId ? String(serviceId) : undefined,
        special_notes: notes ? String(notes) : undefined,
        auto_confirm: false,
        promo_code: code.trim() || undefined,
      });
      setQuote(nextQuote);
      return nextQuote;
    } catch (quoteError) {
      setQuote(null);
      setPromoError(getErrorMessage(quoteError, "Could not calculate this appointment."));
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getSpa(String(id)).then((payload) => normalizeSpa(payload)),
      loadQuote(""),
    ]).then(([spaPayload]) => {
      if (!cancelled) setSpa(spaPayload);
    }).catch((loadError) => {
      if (!cancelled) setError(getErrorMessage(loadError, "Could not load spa booking."));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, date, time, guests, serviceId]);

  const handleConfirm = async () => {
    if (!id || submitting || !quote) return;
    setSubmitting(true);
    try {
      const response = await bookSpa(String(id), {
        date: String(date),
        time: String(time),
        guests: Number(guests || 1),
        service_id: serviceId ? String(serviceId) : undefined,
        special_notes: notes ? String(notes) : undefined,
        auto_confirm: false,
        promo_code: promoCode.trim() || undefined,
      });
      router.replace({
        pathname: "/home/spa/booking_success",
        params: {
          bookingRecordId: String(response?.id ?? response?.booking_id ?? ""),
          bookingCode: String(response?.booking_code ?? response?.bookingCode ?? ""),
          spaName: spa?.title ?? "Spa",
          serviceName: quote?.service_name ?? "Spa service",
          dateTime: `${displayDate} at ${displayTime}`,
          guests: displayGuests,
          totalAmount: String(response?.total_amount ?? quote?.total ?? 0),
          estimatedPoints: String(response?.estimated_points ?? quote?.estimated_points ?? 0),
          promotionName: String(response?.promotion_name ?? quote?.promotion_name ?? ""),
        },
      });
    } catch (bookingError) {
      showToast(getErrorMessage(bookingError, "Could not send this spa booking request."), { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const displayDate = date
    ? new Date(`${String(date)}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : "Date unavailable";
  const displayTime = time || "7:30 PM";
  const displayGuests = guests || "1";

  if (loading) {
    return <SafeAreaView style={styles.container}><PageHeader title="Booking Summary" onBack={handleBack} /><View style={styles.centerState}><ActivityIndicator color={theme.COLORS.primary} /></View></SafeAreaView>;
  }

  if (error || !spa) {
    return <SafeAreaView style={styles.container}><PageHeader title="Booking Summary" onBack={handleBack} /><View style={styles.centerState}><Text style={styles.errorText}>{error || "Spa not found."}</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Booking Summary" onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SpaSummary spa={spa} />

        <SpaBookingDetails
          date={displayDate}
          time={displayTime}
          guests={displayGuests}
        />

        <SpaSpecialNotes notes={notes} editable={false} />

        <PromoCodeInput
          value={promoCode}
          onChange={(value) => { setPromoCode(value); setPromoError(""); }}
          onApply={() => void loadQuote(promoCode)}
          loading={quoteLoading}
          appliedPromotion={quote?.promotion_name}
          error={promoError}
        />
        <BookingPriceSummary quote={quote} loading={quoteLoading} />

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
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 10,
    backgroundColor: theme.COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "700",
    // textTransform: "capitalize", // Matches screenshot "confirm Booking"
  },
});


