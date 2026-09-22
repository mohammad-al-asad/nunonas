import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";
import PageHeader from "../../../../components/ui/PageHeader";
import { getHotel } from "../../../../lib/customer-api";
import { getFirstQueryParam } from "../../../../lib/event-map-utils";
import { getErrorMessage, normalizeHotel } from "../../../../lib/provider-utils";
import type { NormalizedHotel, ProviderPayload } from "../../../../lib/provider-types";
import { showToast } from "../../../../lib/toast";
import {
  bookHotelRoom,
  bookHotelStay,
  getHotelBookingQuote,
  getHotelRoom,
  getMe,
} from "../../../../lib/customer-api";

// Import Modular Components
import HotelStayDetails from "../../../../components/tabs/home/hotels/details/booking/HotelStayDetails";
import HotelGuestInfo from "../../../../components/tabs/home/hotels/details/booking/HotelGuestInfo";
import HotelCancellationPolicy from "../../../../components/tabs/home/hotels/details/booking/HotelCancellationPolicy";
import DateSelector from "../../../../components/tabs/home/dining/details/booking/DateSelector";
import GuestCounter from "../../../../components/tabs/home/dining/details/booking/GuestCounter";
import BookingPriceSummary from "../../../../components/ui/BookingPriceSummary";
import PromoCodeInput from "../../../../components/ui/PromoCodeInput";

type RoomDetails = {
  id?: string;
  title?: string;
  images?: string[];
  guests?: string;
  bed?: string;
  amenities?: Array<{ name?: string }>;
};

function dateValue(offset: number) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nextDateValue(value: string) {
  const next = new Date(`${value}T12:00:00`);
  next.setDate(next.getDate() + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

export default function HotelBookingScreen() {
  const router = useRouter();
  const { id, roomId } = useLocalSearchParams();
  const hotelId = getFirstQueryParam(id);
  const selectedRoomId = getFirstQueryParam(roomId);
  const [hotel, setHotel] = useState<NormalizedHotel | null>(null);
  const [roomTitle, setRoomTitle] = useState("Available Room");
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkInDate, setCheckInDate] = useState(dateValue(1));
  const [checkOutDate, setCheckOutDate] = useState(dateValue(2));
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHotel() {
      if (!hotelId) {
        setError("Hotel not found.");
        setLoading(false);
        return;
      }

      try {
        const [payload, profile] = await Promise.all([
          getHotel<ProviderPayload>(hotelId),
          getMe().catch(() => null),
        ]);
        if (!cancelled) {
          setHotel(normalizeHotel(payload));
          if (profile) {
            setGuestName(profile.full_name || "");
            setGuestEmail(profile.email || "");
            setGuestPhone(profile.phone || "");
          }
        }
        if (selectedRoomId) {
          const roomPayload = await getHotelRoom<RoomDetails>(selectedRoomId);
          if (!cancelled) {
            setRoom(roomPayload);
            if (roomPayload?.title) setRoomTitle(roomPayload.title);
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Failed to load hotel."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHotel();

    return () => {
      cancelled = true;
    };
  }, [hotelId, selectedRoomId]);

  const loadQuote = async (code = promoCode) => {
    if (!hotelId) return null;
    setQuoteLoading(true);
    setPromoError("");
    try {
      const nextQuote = await getHotelBookingQuote(hotelId, {
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests,
        room_id: selectedRoomId || undefined,
        promo_code: code.trim() || undefined,
      });
      setQuote(nextQuote);
      if (nextQuote.room_name) setRoomTitle(nextQuote.room_name);
      if (nextQuote.room_id) {
        const roomPayload = await getHotelRoom<RoomDetails>(String(nextQuote.room_id));
        setRoom(roomPayload);
        if (roomPayload?.title) setRoomTitle(roomPayload.title);
      }
      return nextQuote;
    } catch (quoteError: unknown) {
      setQuote(null);
      setPromoError(getErrorMessage(quoteError, "Could not calculate this stay."));
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (!hotelId || checkOutDate <= checkInDate) return;
    void loadQuote("");
  }, [hotelId, selectedRoomId, checkInDate, checkOutDate, guests]);

  const handleConfirm = async () => {
    if (!hotelId || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests,
        special_notes: "",
        auto_confirm: false,
        guest_name: guestName.trim() || undefined,
        guest_email: guestEmail.trim() || undefined,
        guest_phone: guestPhone.trim() || undefined,
        promo_code: promoCode.trim() || undefined,
      };
      const response = selectedRoomId
        ? await bookHotelRoom(selectedRoomId, payload)
        : await bookHotelStay(hotelId, payload);

      const bookingRecordId = response?.id ?? response?.booking_id ?? "";
      const bookingCode = response?.booking_code ?? response?.bookingCode ?? "";

      router.replace({
        pathname: "/home/hotels/booking_success",
        params: {
          id: hotelId,
          bookingRecordId: String(bookingRecordId),
          bookingCode: String(bookingCode),
          hotelName: hotel?.title ?? "Hotel",
          hotelLocation: hotel?.locationText ?? "",
          roomName: roomTitle,
          checkInDate,
          checkOutDate,
          nights: String(quote?.nights ?? 1),
          guests: String(guests),
          totalAmount: String(response?.total_amount ?? quote?.total ?? 0),
          estimatedPoints: String(response?.estimated_points ?? quote?.estimated_points ?? 0),
          promotionName: String(response?.promotion_name ?? quote?.promotion_name ?? ""),
        },
      });
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Could not complete hotel booking."));
        showToast(getErrorMessage(error, "Could not complete hotel booking."), { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <PageHeader title="Booking" onBack={() => router.back()} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !hotel) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <PageHeader title="Booking" onBack={() => router.back()} />
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>{error || "Hotel not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <PageHeader title="Booking" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hotel Card */}
        <View style={styles.summaryCard}>
          <Image
            source={
              hotel.imageUrl
                ? { uri: hotel.imageUrl }
                : require("../../../../assets/images/discover-experience.png")
            }
            style={styles.hotelImage}
          />
          <View style={styles.hotelDetails}>
            <Text style={styles.hotelName}>{hotel.title}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#facc15" />
              <Text style={styles.ratingText}>{hotel.ratingText}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={theme.COLORS.textSecondary}
              />
              <Text style={styles.locationText}>{hotel.locationText}</Text>
            </View>
          </View>
        </View>

        {/* Room Card */}
        <View style={styles.summaryCard}>
          <Image
            source={room?.images?.[0]
              ? { uri: room.images[0] }
              : require("../../../../assets/images/plan-smarter-with-ai.png")}
            style={styles.roomImage}
          />
          <View style={styles.hotelDetails}>
            <Text style={styles.hotelName}>{roomTitle}</Text>
            {room?.bed || room?.guests ? <View style={styles.infoRow}>
              {room?.bed ? (
              <View style={styles.infoItem}>
                <Ionicons
                  name="bed-outline"
                  size={14}
                  color={theme.COLORS.textSecondary}
                />
                <Text style={styles.infoText}>{room.bed}</Text>
              </View>
              ) : null}
              {room?.guests ? (
              <View style={styles.infoItem}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={theme.COLORS.textSecondary}
                />
                <Text style={styles.infoText}>{room.guests}</Text>
              </View>
              ) : null}
            </View> : null}
            {room?.amenities?.length ? (
              <View style={styles.amenitiesRow}>
                <Text style={styles.amenityText}>
                  {room.amenities.map((item) => item.name).filter(Boolean).join(" • ")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <DateSelector
          title="Check-in date"
          selectedDate={checkInDate}
          onDateSelect={(value) => {
            setCheckInDate(value);
            if (checkOutDate <= value) {
              setCheckOutDate(nextDateValue(value));
            }
          }}
        />
        <DateSelector
          title="Check-out date"
          startDate={nextDateValue(checkInDate)}
          selectedDate={checkOutDate}
          onDateSelect={setCheckOutDate}
        />
        <HotelStayDetails
          checkIn={dateLabel(checkInDate)}
          checkOut={dateLabel(checkOutDate)}
          duration={`${quote?.nights ?? 1} ${(quote?.nights ?? 1) === 1 ? "night" : "nights"}`}
        />
        <GuestCounter guests={guests} onGuestsChange={setGuests} />
        <HotelGuestInfo
          name={guestName}
          email={guestEmail}
          phone={guestPhone}
          onNameChange={setGuestName}
          onEmailChange={setGuestEmail}
          onPhoneChange={setGuestPhone}
        />
        <PromoCodeInput
          value={promoCode}
          onChange={(value) => { setPromoCode(value); setPromoError(""); }}
          onApply={() => void loadQuote(promoCode)}
          loading={quoteLoading}
          appliedPromotion={quote?.promotion_name}
          error={promoError}
        />
        <BookingPriceSummary quote={quote} loading={quoteLoading} />
        <HotelCancellationPolicy />

        <TouchableOpacity
          style={[styles.confirmBtn, (!quote || quoteLoading) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting || quoteLoading || !quote}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.COLORS.white} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Book</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 12,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  roomImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  hotelDetails: {
    flex: 1,
    justifyContent: "center",
  },
  hotelName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
  amenitiesRow: {
    marginTop: 2,
  },
  amenityText: {
    fontSize: 11,
    color: theme.COLORS.textSecondary,
  },
  confirmBtn: {
    backgroundColor: "#1e3a8a",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  confirmBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  confirmBtnDisabled: {
    opacity: 0.55,
  },
});


