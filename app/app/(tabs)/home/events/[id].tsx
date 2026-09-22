import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View, ScrollView, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import { addSaved, bookEventTickets, getEvent, getEventBookingQuote, listSaved, removeSaved } from "../../../../lib/customer-api";
import { showToast } from "../../../../lib/toast";
import { getErrorMessage, getFirstQueryParam, normalizeMapEvent } from "../../../../lib/event-map-utils";
import type {
  CustomerMapEventPayload,
  EventBookingResponse,
  GeoCoordinates,
  NormalizedMapEvent,
} from "../../../../lib/event-map-types";
import { getCurrentCoords } from "../../../../lib/location";

import EventImageHeader from "../../../../components/tabs/home/events/details/EventImageHeader";
import EventKeyInfo from "../../../../components/tabs/home/events/details/EventKeyInfo";
import EventAbout from "../../../../components/tabs/home/events/details/EventAbout";
import EventLocationMap from "../../../../components/tabs/home/events/details/EventLocationMap";
import EventFooter from "../../../../components/tabs/home/events/details/EventFooter";
import BookingPriceSummary from "../../../../components/ui/BookingPriceSummary";
import PromoCodeInput from "../../../../components/ui/PromoCodeInput";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { hydrateSavedItems, markSaved, markUnsaved, savedKey } from "../../../../store/slices/savedSlice";

type BookingState = {
  loading: boolean;
  code: string;
};

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = getFirstQueryParam(id);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<NormalizedMapEvent | null>(null);
  const [origin, setOrigin] = useState<GeoCoordinates | null>(null);
  const [error, setError] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [bookingState, setBookingState] = useState<BookingState>({
    loading: false,
    code: "",
  });
  const [saving, setSaving] = useState(false);
  const dispatch = useAppDispatch();
  const saved = useAppSelector((state) => Boolean(eventId && state.saved.keys[savedKey("event", eventId)]));
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      if (!eventId) {
        setError("Event not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [eventPayload, coords, savedPayload] = await Promise.all([
          getEvent<CustomerMapEventPayload>(eventId),
          getCurrentCoords().catch(() => null),
          listSaved<{ items?: Array<{ entity_type?: string; entity_id?: string }> }>().catch(() => ({ items: [] })),
        ]);
        if (cancelled) {
          return;
        }
        setEvent(normalizeMapEvent(eventPayload));
        setOrigin(coords ? { latitude: coords.latitude, longitude: coords.longitude } : null);
        dispatch(hydrateSavedItems(savedPayload.items ?? []));
      } catch (error: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(error, "Could not load event details."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [dispatch, eventId]);

  const loadQuote = async (code = promoCode) => {
    if (!eventId) return null;
    setQuoteLoading(true);
    setPromoError("");
    try {
      const nextQuote = await getEventBookingQuote(eventId, {
        quantity: ticketQuantity,
        auto_confirm: false,
        promo_code: code.trim() || undefined,
      });
      setQuote(nextQuote);
      return nextQuote;
    } catch (quoteError: unknown) {
      setQuote(null);
      setPromoError(getErrorMessage(quoteError, "Could not calculate ticket price."));
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) void loadQuote("");
  }, [eventId, ticketQuantity]);

  const handleToggleSaved = async () => {
    if (!eventId || saving) {
      return;
    }
    const nextSaved = !saved;
    setSaving(true);
    try {
      if (nextSaved) {
        await addSaved("event", eventId);
      } else {
        await removeSaved("event", eventId);
      }
      dispatch(nextSaved ? markSaved({ entityType: "event", entityId: eventId }) : markUnsaved({ entityType: "event", entityId: eventId }));
      showToast(nextSaved ? "Event saved." : "Event removed from saved items.", { type: "success" });
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "Could not update saved events."), { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const content = useMemo(() => {
    if (!event) {
      return null;
    }

    return (
      <>
        <EventImageHeader event={event} saved={saved} saving={saving} onToggleSaved={handleToggleSaved} />
        <EventKeyInfo event={event} />
        <EventAbout description={event.description} artists={[event.eventType, event.venue]} />
        <EventLocationMap
          venueName={event.venue}
          address={event.address}
          coordinates={
            event.latitude != null && event.longitude != null
              ? { latitude: event.latitude, longitude: event.longitude }
              : null
          }
          origin={origin}
        />
      </>
    );
  }, [event, origin]);

  const handleBook = async () => {
    if (!event?.id || bookingState.loading || quoteLoading) {
      return;
    }
    if (!quote && !(await loadQuote(promoCode))) return;

    try {
      setBookingState({ loading: true, code: bookingState.code });
      const response = await bookEventTickets<EventBookingResponse, { quantity: number; auto_confirm: boolean; promo_code?: string }>(event.id, {
        quantity: ticketQuantity,
        auto_confirm: false,
        promo_code: promoCode.trim() || undefined,
      });
      const bookingCode = response.booking_code ?? response.bookingCode ?? "";
      setBookingState({ loading: false, code: bookingCode });
      const pointsText = Number(response.estimated_points || 0) > 0
        ? ` You can earn approximately ${response.estimated_points} points after completion.`
        : "";
      const promotionText = response.promotion_name
        ? ` ${response.promotion_name} was applied.`
        : "";
      Alert.alert(
        "Booking request sent",
        `${bookingCode ? `Your booking reference is ${bookingCode}.` : "Your event booking request was sent."}${promotionText}${pointsText}`,
        [
          { text: "Done", style: "cancel" },
          {
            text: "View booking",
            onPress: () => response.id
              ? router.push({
                  pathname: "/profile/bookings/details",
                  params: { id: String(response.id), category: "Event" },
                })
              : router.push("/profile/bookings"),
          },
        ],
      );
    } catch (error: unknown) {
      setBookingState({ loading: false, code: bookingState.code });
      Alert.alert("Booking failed", getErrorMessage(error, "Could not book tickets right now."));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={theme.COLORS.primary} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.messageText}>{error || "Event not found."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
        <View style={styles.bookingOptions}>
          <PromoCodeInput
            value={promoCode}
            onChange={(value) => { setPromoCode(value); setPromoError(""); }}
            onApply={() => void loadQuote(promoCode)}
            loading={quoteLoading}
            appliedPromotion={quote?.promotion_name}
            error={promoError}
          />
          <BookingPriceSummary quote={quote} loading={quoteLoading} />
        </View>
      </ScrollView>
      <EventFooter
        event={event}
        quantity={ticketQuantity}
        onChangeQuantity={setTicketQuantity}
        onBook={handleBook}
        booking={bookingState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerState: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  messageText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  bookingOptions: {
    paddingHorizontal: 20,
  },
});


