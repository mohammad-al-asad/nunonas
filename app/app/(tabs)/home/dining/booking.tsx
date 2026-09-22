import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../../components/ui/Button";
import { getBookingAvailability, getRestaurant } from "../../../../lib/customer-api";
import { getFirstQueryParam } from "../../../../lib/event-map-utils";
import { getErrorMessage, normalizeRestaurant } from "../../../../lib/provider-utils";
import type { NormalizedRestaurant, ProviderPayload } from "../../../../lib/provider-types";

// Import Modular Components
import PageHeader from "../../../../components/ui/PageHeader";
import RestaurantSummary from "../../../../components/tabs/home/dining/details/booking/RestaurantSummary";
import DateSelector from "../../../../components/tabs/home/dining/details/booking/DateSelector";
import TimeSelector from "../../../../components/tabs/home/dining/details/booking/TimeSelector";
import GuestCounter from "../../../../components/tabs/home/dining/details/booking/GuestCounter";
import SeatingPreference from "../../../../components/tabs/home/dining/details/booking/SeatingPreference";
import SpecialNotes from "../../../../components/tabs/home/dining/details/booking/SpecialNotes";
import BookingPolicy from "../../../../components/tabs/home/dining/details/booking/BookingPolicy";

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const restaurantId = getFirstQueryParam(id);
  const localDate = new Date();
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [seatingPreferences, setSeatingPreferences] = useState<string[]>(["Indoor", "Outdoor", "No preference"]);
  const [guests, setGuests] = useState(2);
  const [seating, setSeating] = useState("Outdoor");
  const [notes, setNotes] = useState("");
  const [restaurant, setRestaurant] = useState<NormalizedRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurant() {
      if (!restaurantId) {
        setError("Restaurant not found.");
        setLoading(false);
        return;
      }

      try {
        const payload = await getRestaurant<ProviderPayload>(restaurantId);
        if (!cancelled) {
          const normalized = normalizeRestaurant(payload);
          setRestaurant(normalized);
          setSeatingPreferences(normalized.seatingPreferences);
          setSeating(normalized.seatingPreferences[0] ?? "No preference");
        }
      } catch (error: unknown) {
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

  useEffect(() => {
    if (!restaurantId || !selectedDate) return;
    let cancelled = false;
    getBookingAvailability<{ slots?: { time?: string; available?: boolean }[] }>(restaurantId, selectedDate)
      .then((payload) => {
        if (cancelled) return;
        const times = (payload?.slots ?? [])
          .filter((slot) => slot.available !== false && slot.time)
          .map((slot) => String(slot.time));
        setAvailableTimes(times);
        setSelectedTime((current) => times.includes(current) ? current : (times[0] ?? ""));
      })
      .catch(() => {
        if (!cancelled) { setAvailableTimes([]); setSelectedTime(""); }
      });
    return () => { cancelled = true; };
  }, [restaurantId, selectedDate]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Book a Table" onBack={handleBack} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Book a Table" onBack={handleBack} />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || "Restaurant not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Book a Table" onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <RestaurantSummary restaurant={restaurant} />
        
        <DateSelector 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate} 
        />
        
        <TimeSelector 
          selectedTime={selectedTime} 
          onTimeSelect={setSelectedTime} 
          times={availableTimes}
        />
        
        <GuestCounter 
          guests={guests} 
          onGuestsChange={setGuests} 
        />
        
        <SeatingPreference 
          seating={seating} 
          onSeatingChange={setSeating} 
          preferences={seatingPreferences}
        />
        
        <SpecialNotes 
          notes={notes} 
          onNotesChange={setNotes} 
        />
        
        <BookingPolicy policy={restaurant.bookingPolicy} />

        <Button
          title="Continue"
          disabled={!selectedTime}
          onPress={() => {
            if (!selectedTime) return;
            router.push({
              pathname: "/(tabs)/home/dining/confirm_booking",
              params: {
                id: restaurantId ?? "",
                date: selectedDate,
                time: selectedTime,
                guests,
                notes,
                seating,
              }
            });
          }}
          style={styles.continueButton}
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
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 10,
  },
});


