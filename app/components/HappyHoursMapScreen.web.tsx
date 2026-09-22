import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../constants/theme";
import { bookEventTickets, getEvent } from "../lib/customer-events";
import {
  getErrorMessage,
  getFirstQueryParam,
  normalizeMapEvent,
} from "../lib/event-map-utils";
import {
  buildDirectionsUrl,
  getDrivingRoute,
  reverseGeocode,
} from "../lib/google-maps";
import type { DrivingRoute, GeoCoordinates, NormalizedMapEvent } from "../lib/event-map-types";
import { getCurrentCoords, isExpectedLocationError } from "../lib/location";
import { attachEventDistances } from "../lib/map-filtering";
import { listNearbyMapPins, normalizeNearbyMapPins } from "../lib/nearby-offers";
import GoogleWebMap from "./ui/GoogleWebMap";
const DEFAULT_ADDRESS = "Location unavailable";
const NEARBY_MAP_ZOOM = 14;
const SELECTED_EVENT_ZOOM = 15;
type BookingState = { loading: boolean; code: string; status: string };

export default function MapScreenWeb() {
  const router = useRouter();
  const { offerId, eventId } = useLocalSearchParams<{ offerId?: string | string[]; eventId?: string | string[] }>();
  const [markerCoords, setMarkerCoords] = useState<GeoCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [addressText, setAddressText] = useState(DEFAULT_ADDRESS);
  const [offersLoading, setOffersLoading] = useState(true);
  const [nearbyEvents, setNearbyEvents] = useState<NormalizedMapEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<NormalizedMapEvent | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<NormalizedMapEvent | null>(null);
  const [selectedEventLoading, setSelectedEventLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<DrivingRoute | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [bookingState, setBookingState] = useState<BookingState>({
    loading: false,
    code: "",
    status: "",
  });

  const loadCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError("");
    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        setLocationError("Turn on location access to open the nearby event map.");
        return;
      }

      setMarkerCoords({ latitude: coords.latitude, longitude: coords.longitude });
      setLocationLoading(false);
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      if (address) {
        setAddressText(address);
      }
    } catch (error: unknown) {
      setLocationError("Your current location could not be loaded. Please try again.");
      if (!isExpectedLocationError(error)) {
        console.error("Error fetching location:", error);
      }
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadOffers() {
      try {
        setOffersLoading(true);
        const items = normalizeNearbyMapPins(await listNearbyMapPins(50));
        setNearbyEvents(items);
        const selectedId = getFirstQueryParam(eventId) ?? getFirstQueryParam(offerId);
        const initialEvent = selectedId
          ? items.find((item) => item.id === selectedId) ?? null
          : null;
        setSelectedEvent(initialEvent);
      } catch (error: unknown) {
        console.error("Error loading offers for web map:", error);
        setNearbyEvents([]);
      } finally {
        setOffersLoading(false);
      }
    }

    void loadCurrentLocation();
    loadOffers();
  }, [eventId, loadCurrentLocation, offerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedEventDetails() {
      if (!selectedEvent?.id) {
        setSelectedEventDetails(null);
        setBookingState({ loading: false, code: "", status: "" });
        return;
      }

      try {
        setSelectedEventLoading(true);
        setTicketQuantity(1);
        setSelectedEventDetails(normalizeMapEvent(selectedEvent));
        setBookingState({
          loading: false,
          code: selectedEvent.currentBookingCode ?? "",
          status: selectedEvent.currentBookingStatus ?? "",
        });

        if (selectedEvent.entityType !== "event") {
          return;
        }
        const eventPayload = await getEvent(selectedEvent.id);
        if (cancelled) {
          return;
        }

        const normalized = normalizeMapEvent({
          ...selectedEvent,
          ...eventPayload,
        });

        setSelectedEventDetails(normalized);
        setBookingState({
          loading: false,
          code: normalized.currentBookingCode ?? "",
          status: normalized.currentBookingStatus ?? "",
        });
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("Error loading selected event details:", error);
          setSelectedEventDetails(normalizeMapEvent(selectedEvent));
        }
      } finally {
        if (!cancelled) {
          setSelectedEventLoading(false);
        }
      }
    }

    loadSelectedEventDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedEvent]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (!markerCoords || !selectedEvent?.id) {
        setRouteInfo(null);
        return;
      }
      const targetEvent = selectedEventDetails ?? selectedEvent;
      if (targetEvent?.latitude == null || targetEvent?.longitude == null) {
        setRouteInfo(null);
        return;
      }

      const route = await getDrivingRoute(markerCoords, {
        latitude: targetEvent.latitude,
        longitude: targetEvent.longitude,
      });

      if (!cancelled) {
        setRouteInfo(route);
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [markerCoords, selectedEvent, selectedEventDetails]);

  const cardEvent = selectedEventDetails ?? selectedEvent;
  const resolvedBookingStatus = bookingState.status || cardEvent?.currentBookingStatus || "";
  const resolvedBookingCode = bookingState.code || cardEvent?.currentBookingCode || "";
  const resolvedBookingStatusText = resolvedBookingCode
    ? `${resolvedBookingStatus || "confirmed"} - ${resolvedBookingCode}`
    : cardEvent?.entityType === "happy_hour"
      ? cardEvent.isOpenNow
        ? "Live now"
        : "Scheduled"
    : resolvedBookingStatus || "Not booked yet";
  const canShowInlineBooking =
    cardEvent?.canBookOnMap &&
    !cardEvent?.isSoldOut &&
    !resolvedBookingCode;
  const routeDistanceText =
    routeInfo?.distanceText ??
    (typeof cardEvent?.distanceKm === "number" ? `${cardEvent.distanceKm.toFixed(1)} km away` : cardEvent?.distance ?? "Nearby");
  const routeDurationText = routeInfo?.durationText ?? "Select for route";
  const routeLocationText = cardEvent?.address ?? cardEvent?.locationLabel ?? cardEvent?.location ?? "Location available";
  const visibleEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchingEvents = nearbyEvents.filter((event) => {
      const searchableText = [
        event.title,
        event.eventType,
        event.tag,
        event.venue,
        event.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
        return false;
      }
      return true;
    });
    return attachEventDistances(matchingEvents, markerCoords);
  }, [markerCoords, nearbyEvents, searchQuery]);

  useEffect(() => {
    if (
      selectedEvent &&
      !visibleEvents.some((event) => event.id === selectedEvent.id)
    ) {
      setSelectedEvent(null);
    }
  }, [selectedEvent, visibleEvents]);

  const openDirections = async () => {
    const targetEvent = selectedEventDetails ?? selectedEvent;
    if (!markerCoords || targetEvent?.latitude == null || targetEvent?.longitude == null) {
      return;
    }

    const url = buildDirectionsUrl(markerCoords, {
      latitude: targetEvent.latitude,
      longitude: targetEvent.longitude,
    });

    if (!url) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error: unknown) {
      console.error("Error opening directions:", error);
    }
  };

  const openEventDetails = () => {
    const detailRoute = selectedEventDetails?.detailRoute ?? selectedEvent?.detailRoute;
    const eventDetailsId = selectedEventDetails?.id ?? selectedEvent?.id;
    if (detailRoute) {
      router.push(detailRoute);
      return;
    }
    if (eventDetailsId && selectedEvent?.entityType !== "happy_hour") {
      router.push(`/home/events/${eventDetailsId}`);
    }
  };

  const handleBookNow = async () => {
    const targetEvent = selectedEventDetails ?? selectedEvent;
    const eventDetailsId = targetEvent?.id;
    if (!eventDetailsId || bookingState.loading) {
      return;
    }
    if (!targetEvent?.canBookOnMap) {
      openEventDetails();
      return;
    }
    if (targetEvent?.isSoldOut) {
      return;
    }
    if (bookingState.code) {
      openEventDetails();
      return;
    }

    try {
      setBookingState((current) => ({ ...current, loading: true }));
      const response = await bookEventTickets(eventDetailsId, {
        quantity: ticketQuantity,
        auto_confirm: false,
      });
      const bookingCode = response?.booking_code ?? response?.bookingCode ?? "";
      const bookingStatus = response?.status ?? "pending";
      setBookingState({
        loading: false,
        code: bookingCode,
        status: bookingStatus,
      });
      setSelectedEventDetails((current) =>
        current
          ? {
              ...current,
              currentBookingCode: bookingCode,
              currentBookingStatus: bookingStatus,
            }
          : current,
      );
      Alert.alert(
        "Ticket booked",
        bookingCode
          ? `Your booking reference is ${bookingCode}.`
          : "Your event ticket has been booked."
      );
    } catch (error: unknown) {
      setBookingState((current) => ({ ...current, loading: false }));
      Alert.alert("Booking failed", getErrorMessage(error, "Could not book tickets right now."));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={theme.COLORS.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search places or areas"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={19} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.mapShell}>
          {markerCoords ? (
            <GoogleWebMap
              center={
                selectedEvent?.latitude != null && selectedEvent?.longitude != null
                  ? { latitude: selectedEvent.latitude, longitude: selectedEvent.longitude }
                  : markerCoords
              }
              markers={visibleEvents.map((event) => ({
                id: String(event.id),
                title: event.title,
                latitude: event.latitude,
                longitude: event.longitude,
                imageUrl: event.imageUrl,
                kind: event.entityType as "restaurant" | "hotel" | "spa" | "event" | "happy_hour",
              }))}
              selectedId={selectedEvent?.id ? String(selectedEvent.id) : null}
              onMarkerPress={(marker) => {
                const event = nearbyEvents.find((item) => String(item.id) === marker.id);
                if (event) setSelectedEvent(event);
              }}
              height={420}
              zoomLevel={
                selectedEvent ? SELECTED_EVENT_ZOOM : NEARBY_MAP_ZOOM
              }
              showCenterMarker={!selectedEvent}
            />
          ) : (
            <View style={styles.mapLocationState}>
              {locationLoading ? (
                <>
                  <ActivityIndicator size="large" color={theme.COLORS.primary} />
                  <Text style={styles.mapLocationTitle}>Finding your current location…</Text>
                  <Text style={styles.mapLocationText}>
                    The map will open only after your real position is available.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="location-outline" size={36} color={theme.COLORS.primary} />
                  <Text style={styles.mapLocationTitle}>Location needed</Text>
                  <Text style={styles.mapLocationText}>{locationError}</Text>
                  <TouchableOpacity style={styles.mapRetryButton} onPress={() => void loadCurrentLocation()}>
                    <Text style={styles.mapRetryText}>Try again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

            <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Nearby events</Text>
          <Text style={styles.locationValue}>{addressText}</Text>
          <Text style={styles.locationHint}>
            All events are listed below. Select one to load directions.
          </Text>
        </View>

        {offersLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={theme.COLORS.primary} />
            <Text style={styles.loadingText}>Loading nearby events...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventPills}
            >
              {visibleEvents.map((offer) => (
                <TouchableOpacity
                  key={String(offer.id)}
                  style={[
                    styles.eventPill,
                    selectedEvent?.id === offer.id ? styles.eventPillActive : null,
                  ]}
                  onPress={() => setSelectedEvent(offer)}
                >
                  <Text
                    style={[
                      styles.eventPillText,
                      selectedEvent?.id === offer.id ? styles.eventPillTextActive : null,
                    ]}
                    numberOfLines={1}
                  >
                    {offer.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {false && cardEvent ? (
              <View style={styles.detailsCard}>
                {selectedEventLoading ? (
                  <View style={styles.inlineLoadingRow}>
                    <ActivityIndicator size="small" color={theme.COLORS.primary} />
                    <Text style={styles.loadingText}>Loading event details...</Text>
                  </View>
                ) : null}

                {cardEvent.imageUrl ? (
                  <Image source={{ uri: cardEvent.imageUrl }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroFallback}>
                    <Ionicons name="calendar" size={28} color={theme.COLORS.white} />
                  </View>
                )}

                <Text style={styles.offerTitle}>{cardEvent.title}</Text>
                <Text style={styles.offerSubtitle}>{cardEvent.tag ?? "Active event"}</Text>
                <View style={styles.routeSummaryCard}>
                  <View style={styles.routeSummaryHeader}>
                    <Ionicons name="location-outline" size={18} color={theme.COLORS.primary} />
                    <Text style={styles.routeSummaryTitle}>{cardEvent.venue ?? "Event location"}</Text>
                  </View>
                  <Text style={styles.offerLocation}>{routeLocationText}</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricPill}>
                      <Ionicons name="trail-sign-outline" size={15} color={theme.COLORS.primary} />
                      <Text style={styles.metricText}>{routeDistanceText}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="time-outline" size={15} color={theme.COLORS.primary} />
                      <Text style={styles.metricText}>{routeDurationText}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoTile}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>{cardEvent.date ?? "Date TBA"}</Text>
                  </View>
                  <View style={styles.infoTile}>
                    <Text style={styles.infoLabel}>
                      {cardEvent.entityType === "happy_hour" ? "Status" : "Booking"}
                    </Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {resolvedBookingStatusText}
                    </Text>
                  </View>
                </View>

                {cardEvent.description ? (
                  <Text style={styles.descriptionText}>{cardEvent.description}</Text>
                ) : null}

                {canShowInlineBooking ? (
                  <View style={styles.quantityCard}>
                    <Text style={styles.quantityLabel}>Tickets</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => setTicketQuantity((current) => Math.max(1, current - 1))}
                      >
                        <Ionicons name="remove" size={16} color={theme.COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{ticketQuantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => setTicketQuantity((current) => Math.min(20, current + 1))}
                      >
                        <Ionicons name="add" size={16} color={theme.COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={openEventDetails}>
                    <Ionicons name="information-circle-outline" size={18} color="#1d4ed8" />
                    <Text style={styles.secondaryButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
                    <Ionicons name="navigate-outline" size={18} color={theme.COLORS.white} />
                    <Text style={styles.directionsButtonText}>Directions</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.bookButton,
                    resolvedBookingCode ? styles.bookedButton : null,
                    cardEvent.isSoldOut && !resolvedBookingCode ? styles.disabledButton : null,
                  ]}
                  onPress={handleBookNow}
                  disabled={bookingState.loading || (cardEvent.isSoldOut && !resolvedBookingCode)}
                >
                  {bookingState.loading ? (
                    <ActivityIndicator size="small" color={theme.COLORS.white} />
                  ) : (
                    <Text style={styles.bookButtonText}>
                      {resolvedBookingCode
                        ? "View Booking"
                        : cardEvent.isSoldOut
                          ? "Sold Out"
                          : canShowInlineBooking
                            ? "Book Now"
                            : "Open Details"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="location-outline" size={28} color={theme.COLORS.primary} />
                <Text style={styles.emptyStateTitle}>
                  Select an event
                </Text>
                <Text style={styles.emptyStateText}>
                  Choose an item from the list to load its location, directions, and available actions.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  topBar: {
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.white,
  },
  searchBox: {
    flex: 1,
    height: 46,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: theme.COLORS.white,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: theme.COLORS.textPrimary,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.white,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
  },
  categoryRow: {
    gap: 8,
    paddingRight: 12,
  },
  categoryChip: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 999,
    backgroundColor: theme.COLORS.white,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryChipActive: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primary,
  },
  categoryChipText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },
  mapShell: {
    height: 420,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: "#dbeafe",
  },
  mapLocationState: {
    flex: 1,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  mapLocationTitle: {
    marginTop: 14,
    color: theme.COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  mapLocationText: {
    marginTop: 7,
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  mapRetryButton: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  mapRetryText: {
    color: theme.COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  noticeCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  noticeBody: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  noticeText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: theme.COLORS.textSecondary,
  },
  locationCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 18,
    padding: 16,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  locationHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: theme.COLORS.textSecondary,
  },
  loadingState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  eventPills: {
    gap: 8,
    paddingVertical: 4,
  },
  eventPill: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: 220,
  },
  eventPillActive: {
    backgroundColor: theme.COLORS.primary,
  },
  eventPillText: {
    color: theme.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  eventPillTextActive: {
    color: theme.COLORS.white,
  },
  detailsCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 16,
  },
  routeSummaryCard: {
    marginTop: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  routeSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeSummaryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  emptyStateCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: theme.COLORS.textSecondary,
  },
  inlineLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    marginBottom: 14,
  },
  heroFallback: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  offerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
  offerLocation: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 19,
    color: theme.COLORS.textSecondary,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  metricPill: {
    flex: 1,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  metricText: {
    color: theme.COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  infoTile: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  descriptionText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: theme.COLORS.textSecondary,
  },
  quantityCard: {
    marginTop: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "700",
  },
  directionsButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  directionsButtonText: {
    color: theme.COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  bookButton: {
    marginTop: 12,
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
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


