import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import Button from "../../../../components/ui/Button";
import { getBookingAvailability, getSpa, getSpaServices } from "../../../../lib/customer-api";
import { getFirstQueryParam } from "../../../../lib/event-map-utils";
import { getErrorMessage, normalizeSpa } from "../../../../lib/provider-utils";
import type { NormalizedSpa, ProviderPayload } from "../../../../lib/provider-types";

// Import Modular Components
import PageHeader from "../../../../components/ui/PageHeader";
import SpaSummary from "../../../../components/tabs/home/spa/details/booking/SpaSummary";
import DateSelector from "../../../../components/tabs/home/dining/details/booking/DateSelector";
import TimeSelector from "../../../../components/tabs/home/dining/details/booking/TimeSelector";
import GuestCounter from "../../../../components/tabs/home/dining/details/booking/GuestCounter";
import SpecialNotes from "../../../../components/tabs/home/spa/details/booking/SpaSpecialNotes";

export default function SpaBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const spaId = getFirstQueryParam(id);
  const localDate = new Date();
  const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [spa, setSpa] = useState<NormalizedSpa | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSpa() {
      if (!spaId) {
        setError("Spa not found.");
        setLoading(false);
        return;
      }

      try {
        const [payload, servicesPayload] = await Promise.all([
          getSpa<ProviderPayload>(spaId),
          getSpaServices<{ items?: any[] }>(spaId),
        ]);
        if (!cancelled) {
          setSpa(normalizeSpa(payload));
          const availableServices = servicesPayload?.items ?? [];
          setServices(availableServices);
          setSelectedServiceId(String(availableServices[0]?.id ?? availableServices[0]?._id ?? ""));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Failed to load spa."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSpa();

    return () => {
      cancelled = true;
    };
  }, [spaId]);

  useEffect(() => {
    if (!spaId || !selectedDate) return;
    let cancelled = false;
    getBookingAvailability<{ slots?: { time?: string; available?: boolean }[] }>(spaId, selectedDate, "spa")
      .then((payload) => {
        if (cancelled) return;
        const times = (payload?.slots ?? [])
          .filter((slot) => slot.available !== false && slot.time)
          .map((slot) => String(slot.time));
        setAvailableTimes(times);
        setSelectedTime((current) => times.includes(current) ? current : (times[0] ?? ""));
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableTimes([]);
          setSelectedTime("");
        }
      });
    return () => { cancelled = true; };
  }, [spaId, selectedDate]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Book Spa" onBack={handleBack} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !spa) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Book Spa" onBack={handleBack} />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || "Spa not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Book Spa" onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SpaSummary spa={spa} />

        <View style={styles.serviceSection}>
          <Text style={styles.serviceTitle}>Select service</Text>
          {services.map((service) => {
            const serviceId = String(service.id ?? service._id ?? "");
            const selected = selectedServiceId === serviceId;
            return (
              <TouchableOpacity
                key={serviceId}
                onPress={() => setSelectedServiceId(serviceId)}
                style={[styles.serviceCard, selected && styles.serviceCardSelected]}
              >
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName}>{service.name || "Spa service"}</Text>
                  <Text style={styles.serviceDescription}>{service.description || service.category || ""}</Text>
                </View>
                <Text style={styles.servicePrice}>${Number(service.price || 0).toFixed(2)}</Text>
              </TouchableOpacity>
            );
          })}
          {!services.length ? <Text style={styles.errorText}>No bookable spa services are available.</Text> : null}
        </View>

        <DateSelector
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        <TimeSelector
          selectedTime={selectedTime}
          onTimeSelect={setSelectedTime}
          times={availableTimes}
        />

        <GuestCounter guests={guests} onGuestsChange={setGuests} />

        <SpecialNotes notes={notes} onNotesChange={setNotes} />

        <Button
          title="Continue"
          onPress={() => {
            router.push({
              pathname: "/home/spa/confirm_booking",
              params: {
                id: spaId ?? "",
                date: selectedDate,
                time: selectedTime,
                guests,
                notes,
                serviceId: selectedServiceId,
              },
            });
          }}
          disabled={!selectedTime || !selectedServiceId}
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
  serviceSection: {
    marginBottom: 24,
  },
  serviceTitle: {
    color: theme.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  serviceCardSelected: {
    borderColor: theme.COLORS.primary,
    backgroundColor: "#eff6ff",
  },
  serviceText: {
    flex: 1,
  },
  serviceName: {
    color: theme.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  serviceDescription: {
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  servicePrice: {
    color: theme.COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
});


