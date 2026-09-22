import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Image,
  Linking,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import NativeMapboxMap from "./ui/NativeMapboxMap";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import theme from "../constants/theme";
import { bookEventTickets, getEvent } from "../lib/customer-events";
import {
  getErrorMessage,
  normalizeMapEvent,
} from "../lib/event-map-utils";
import {
  buildDirectionsUrl,
  getDrivingRoute,
} from "../lib/google-maps";
import type { DrivingRoute, GeoCoordinates, NormalizedMapEvent } from "../lib/event-map-types";
import { getCurrentCoords, isExpectedLocationError } from "../lib/location";
import { attachEventDistances } from "../lib/map-filtering";
import { listNearbyMapPins, normalizeNearbyMapPins } from "../lib/nearby-offers";
import { showToast } from "../lib/toast";

const { width, height } = Dimensions.get("window");
const NEARBY_MAP_ZOOM = 14;
const SELECTED_EVENT_ZOOM = 15;
const NEARBY_REGION_DELTA = 0.025;
type ServiceFilter = "all" | "restaurant" | "hotel" | "spa" | "event" | "happy_hour";
const SERVICE_FILTERS: Array<{ key: ServiceFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "restaurant", label: "Restaurants" },
  { key: "hotel", label: "Hotels" },
  { key: "spa", label: "Spas" },
  { key: "event", label: "Events" },
  { key: "happy_hour", label: "Happy Hours" },
];
type BookingState = { loading: boolean; code: string; status: string };
type CloudConfig = {
  id: number;
  size: number;
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
  top: `${number}%`;
  left: `${number}%`;
};

const CLOUDS_CONFIG: CloudConfig[] = [
  { id: 1, size: 220, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "5%", left: "-10%" },
  { id: 2, size: 250, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "10%", left: "10%" },
  { id: 3, size: 200, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "25%", left: "-5%" },
  { id: 4, size: 240, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "20%", left: "15%" },
  { id: 5, size: 210, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "35%", left: "0%" },
  { id: 6, size: 260, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "5%", left: "50%" },
  { id: 7, size: 230, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "12%", left: "70%" },
  { id: 8, size: 200, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "28%", left: "60%" },
  { id: 9, size: 250, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "20%", left: "80%" },
  { id: 10, size: 220, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "32%", left: "75%" },
  { id: 11, size: 240, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "55%", left: "-10%" },
  { id: 12, size: 210, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "60%", left: "10%" },
  { id: 13, size: 250, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "75%", left: "-5%" },
  { id: 14, size: 200, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "70%", left: "15%" },
  { id: 15, size: 230, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "85%", left: "0%" },
  { id: 16, size: 250, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "55%", left: "50%" },
  { id: 17, size: 220, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "62%", left: "70%" },
  { id: 18, size: 260, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "78%", left: "60%" },
  { id: 19, size: 210, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "70%", left: "80%" },
  { id: 20, size: 240, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "85%", left: "75%" },
  { id: 21, size: 260, xStart: 0, yStart: 0, xEnd: -width, yEnd: 0, top: "40%", left: "-15%" },
  { id: 22, size: 230, xStart: 0, yStart: 0, xEnd: -width, yEnd: 0, top: "45%", left: "10%" },
  { id: 23, size: 250, xStart: 0, yStart: 0, xEnd: -width, yEnd: 0, top: "30%", left: "5%" },
  { id: 24, size: 220, xStart: 0, yStart: 0, xEnd: -width, yEnd: 0, top: "50%", left: "8%" },
  { id: 25, size: 250, xStart: 0, yStart: 0, xEnd: width, yEnd: 0, top: "40%", left: "75%" },
  { id: 26, size: 220, xStart: 0, yStart: 0, xEnd: width, yEnd: 0, top: "45%", left: "60%" },
  { id: 27, size: 260, xStart: 0, yStart: 0, xEnd: width, yEnd: 0, top: "65%", left: "65%" },
  { id: 28, size: 230, xStart: 0, yStart: 0, xEnd: width, yEnd: 0, top: "50%", left: "62%" },
  { id: 29, size: 270, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height / 2, top: "35%", left: "25%" },
  { id: 30, size: 280, xStart: 0, yStart: 0, xEnd: width, yEnd: -height / 2, top: "30%", left: "45%" },
  { id: 31, size: 260, xStart: 0, yStart: 0, xEnd: -width, yEnd: height / 2, top: "45%", left: "20%" },
  { id: 32, size: 290, xStart: 0, yStart: 0, xEnd: width, yEnd: height / 2, top: "40%", left: "40%" },
  { id: 33, size: 280, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height / 4, top: "25%", left: "30%" },
  { id: 34, size: 270, xStart: 0, yStart: 0, xEnd: width, yEnd: -height / 4, top: "28%", left: "48%" },
  { id: 35, size: 290, xStart: 0, yStart: 0, xEnd: -width, yEnd: height / 4, top: "48%", left: "32%" },
  { id: 36, size: 280, xStart: 0, yStart: 0, xEnd: width, yEnd: height / 4, top: "50%", left: "45%" },
  { id: 37, size: 200, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "0%", left: "20%" },
  { id: 38, size: 220, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "0%", left: "40%" },
  { id: 39, size: 210, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "90%", left: "20%" },
  { id: 40, size: 230, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "90%", left: "50%" },
  { id: 41, size: 250, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height / 3, top: "15%", left: "-15%" },
  { id: 42, size: 240, xStart: 0, yStart: 0, xEnd: width, yEnd: -height / 3, top: "15%", left: "85%" },
  { id: 43, size: 230, xStart: 0, yStart: 0, xEnd: -width, yEnd: height / 3, top: "80%", left: "-15%" },
  { id: 44, size: 260, xStart: 0, yStart: 0, xEnd: width, yEnd: height / 3, top: "80%", left: "85%" },
  { id: 45, size: 210, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height / 2, top: "8%", left: "28%" },
  { id: 46, size: 220, xStart: 0, yStart: 0, xEnd: width, yEnd: -height / 2, top: "8%", left: "55%" },
  { id: 47, size: 230, xStart: 0, yStart: 0, xEnd: -width, yEnd: height / 2, top: "88%", left: "30%" },
  { id: 48, size: 240, xStart: 0, yStart: 0, xEnd: width, yEnd: height / 2, top: "88%", left: "58%" },
  { id: 49, size: 250, xStart: 0, yStart: 0, xEnd: -width, yEnd: 0, top: "45%", left: "-8%" },
  { id: 50, size: 240, xStart: 0, yStart: 0, xEnd: width, yEnd: 0, top: "45%", left: "78%" },
  { id: 51, size: 220, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height, top: "2%", left: "5%" },
  { id: 52, size: 230, xStart: 0, yStart: 0, xEnd: width, yEnd: -height, top: "2%", left: "75%" },
  { id: 53, size: 210, xStart: 0, yStart: 0, xEnd: -width, yEnd: height, top: "95%", left: "5%" },
  { id: 54, size: 220, xStart: 0, yStart: 0, xEnd: width, yEnd: height, top: "95%", left: "75%" },
  { id: 55, size: 260, xStart: 0, yStart: 0, xEnd: -width, yEnd: -height / 4, top: "12%", left: "-5%" },
  { id: 56, size: 250, xStart: 0, yStart: 0, xEnd: width, yEnd: -height / 4, top: "12%", left: "80%" },
  { id: 57, size: 270, xStart: 0, yStart: 0, xEnd: -width, yEnd: height / 4, top: "82%", left: "-5%" },
  { id: 58, size: 260, xStart: 0, yStart: 0, xEnd: width, yEnd: height / 4, top: "82%", left: "80%" },
  { id: 59, size: 280, xStart: 0, yStart: 0, xEnd: -width / 2, yEnd: -height, top: "10%", left: "38%" },
  { id: 60, size: 290, xStart: 0, yStart: 0, xEnd: width / 2, yEnd: height, top: "85%", left: "42%" },
];

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const transitionProgress = useRef(new Animated.Value(0)).current;
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;

  const [markerCoords, setMarkerCoords] = useState<GeoCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [nearbyEvents, setNearbyEvents] = useState<NormalizedMapEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEventList, setShowEventList] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [offersLoading, setOffersLoading] = useState(true);
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

      const currentCoords = { latitude: coords.latitude, longitude: coords.longitude };
      setMarkerCoords(currentCoords);
      setLocationLoading(false);
    } catch (error: unknown) {
      setLocationError("Your current location could not be loaded. Please try again.");
      if (!isExpectedLocationError(error)) {
        console.error("Error fetching location: ", error);
      }
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransitionAnimation();

    async function loadOffers() {
      try {
        setOffersLoading(true);
        const items = normalizeNearbyMapPins(await listNearbyMapPins(50));
        setNearbyEvents(items);
        // Do not open an event automatically. The map should show all event
        // pointers first; details open only after the user taps a pointer.
      } catch (error: unknown) {
        console.error("Error loading offers for map: ", error);
        setNearbyEvents([]);
      } finally {
        setOffersLoading(false);
      }
    }

    void loadCurrentLocation();
    loadOffers();
  }, [loadCurrentLocation]);

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
          setBookingState({
            loading: false,
            code: selectedEvent.currentBookingCode ?? "",
            status: selectedEvent.currentBookingStatus ?? "",
          });
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

  const startTransitionAnimation = () => {
    cloudOpacity.setValue(1);
    cloudAnim.setValue(1);
    transitionProgress.setValue(0);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cloudOpacity, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(cloudAnim, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(transitionProgress, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimationComplete(true);
      });
    }, 400);
  };

  const openDirections = async () => {
    const targetEvent = selectedEventDetails ?? selectedEvent;
    if (!markerCoords || targetEvent?.latitude == null || targetEvent?.longitude == null) {
      return;
    }

    // Refresh the in-app route at the moment the user asks for directions so
    // the distance and ETA reflect Google's current traffic data.
    const liveRoute = await getDrivingRoute(markerCoords, {
      latitude: targetEvent.latitude,
      longitude: targetEvent.longitude,
    });
    if (liveRoute) {
      setRouteInfo(liveRoute);
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
          : current
      );
      showToast(bookingCode ? `Ticket booked: ${bookingCode}` : "Your event ticket has been booked.", { type: "success" });
    } catch (error: unknown) {
      setBookingState((current) => ({ ...current, loading: false }));
      showToast(getErrorMessage(error, "Could not book tickets right now."), { type: "error" });
    }
  };
  const cardEvent = selectedEventDetails ?? selectedEvent;
  const resolvedBookingStatus = bookingState.status || cardEvent?.currentBookingStatus || "";
  const resolvedBookingCode = bookingState.code || cardEvent?.currentBookingCode || "";
  const resolvedBookingStatusText = resolvedBookingCode
    ? `${resolvedBookingStatus || "confirmed"} - ${resolvedBookingCode}`
    : cardEvent?.entityType === "happy_hour"
      ? cardEvent.isOpenNow
        ? "Live now"
        : "Scheduled"
    : resolvedBookingStatus
      ? resolvedBookingStatus
      : "Not booked yet";
  const canShowInlineBooking =
    cardEvent?.canBookOnMap &&
    !cardEvent?.isSoldOut &&
    !resolvedBookingCode;
  const routeDistanceText =
    routeInfo?.distanceText ??
    (typeof cardEvent?.distanceKm === "number" ? `${cardEvent.distanceKm.toFixed(1)} km away` : cardEvent?.distance ?? "Nearby");
  const routeDurationText = routeInfo?.durationText ?? "Tap Directions";
  const routeLocationText = cardEvent?.address ?? cardEvent?.locationLabel ?? cardEvent?.location ?? "Location available";
  const primaryActionLabel = resolvedBookingCode
    ? "View Booking"
    : cardEvent?.isSoldOut
      ? "Sold Out"
      : canShowInlineBooking
        ? "Book Now"
        : "Open Details";
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
      return serviceFilter === "all" || event.entityType === serviceFilter;
    });
    return attachEventDistances(matchingEvents, markerCoords);
  }, [markerCoords, nearbyEvents, searchQuery, serviceFilter]);

  const availableServiceFilters = useMemo(() => {
    const available = new Set(nearbyEvents.map((event) => event.entityType));
    return SERVICE_FILTERS.filter((filter) => filter.key === "all" || available.has(filter.key));
  }, [nearbyEvents]);

  useEffect(() => {
    if (
      selectedEvent &&
      !visibleEvents.some((event) => event.id === selectedEvent.id)
    ) {
      setSelectedEvent(null);
      setShowEventList(true);
    }
  }, [selectedEvent, visibleEvents]);

  const selectMapEvent = (event: NormalizedMapEvent) => {
    setSelectedEvent(event);
    setShowEventList(false);
    mapRef.current?.animateCamera({
      center: {
        latitude: Number(event.latitude),
        longitude: Number(event.longitude),
      },
      zoom: SELECTED_EVENT_ZOOM,
    }, { duration: 500 });
  };

  const recenterMap = () => {
    if (!markerCoords) return;
    mapRef.current?.animateCamera({
      center: markerCoords,
      zoom: NEARBY_MAP_ZOOM,
    }, { duration: 500 });
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject}>
        {markerCoords ? (
                    <NativeMapboxMap
            center={markerCoords}
            zoomLevel={selectedEvent ? SELECTED_EVENT_ZOOM : NEARBY_MAP_ZOOM}
            showUserLocation
            routeCoordinates={routeInfo?.coordinates ?? []}
            markers={visibleEvents.map((offer) => ({
              id: `event-${offer.id}`,
              kind: offer.entityType as "restaurant" | "hotel" | "spa" | "event" | "happy_hour",
              coordinate: { latitude: Number(offer.latitude), longitude: Number(offer.longitude) },
              onPress: () => selectMapEvent(offer),
              children: (
                <View style={styles.eventMarkerWrap} accessibilityLabel={`Event location: ${offer.title}`}>
                  <View style={[styles.eventMarkerTitle, selectedEvent?.id === offer.id && styles.eventMarkerTitleActive]}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.eventMarkerTitleText, selectedEvent?.id === offer.id && styles.eventMarkerTitleTextActive]}>{offer.title}</Text>
                  </View>
                  <View style={[styles.eventMarkerRing, selectedEvent?.id === offer.id && styles.eventMarkerRingActive]}>
                    <View style={[styles.eventMarkerImage, styles.eventMarkerEventIcon]}><MaterialIcons name="event-note" size={26} color={theme.COLORS.primary} /></View>
                  </View>
                </View>
              ),
            }))}
          />
        ) : (
          <View style={styles.locationLoadingState}>
            {locationLoading ? (
              <>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
                <Text style={styles.locationLoadingTitle}>Finding your current locationâ€¦</Text>
                <Text style={styles.locationLoadingText}>
                  The map will open only after your real position is available.
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="location-outline" size={36} color={theme.COLORS.primary} />
                <Text style={styles.locationLoadingTitle}>Location needed</Text>
                <Text style={styles.locationLoadingText}>{locationError}</Text>
                <TouchableOpacity style={styles.locationRetryButton} onPress={() => void loadCurrentLocation()}>
                  <Text style={styles.locationRetryText}>Try again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {!animationComplete && (
          <Animated.View style={[styles.cloudOverlay, { opacity: cloudOpacity }]}>
            {CLOUDS_CONFIG.map((cloud) => {
              const translateX = cloudAnim.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [cloud.xStart, 0, cloud.xEnd],
              });
              const translateY = cloudAnim.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [cloud.yStart, 0, cloud.yEnd],
              });

              return (
                <Animated.View
                  key={cloud.id}
                  style={[
                    styles.cloudWrapper,
                    {
                      top: cloud.top,
                      left: cloud.left,
                      transform: [{ translateX }, { translateY }],
                    },
                  ]}
                >
                  <Ionicons name="cloud" size={cloud.size} color="#ffffff" style={styles.cloudIconShadow} />
                </Animated.View>
              );
            })}

            <ActivityIndicator size="large" color="#ffffff" style={styles.spinnerOverCloud} />
          </Animated.View>
        )}
      </View>

      <View style={[styles.mapHeader, { top: Math.max(insets.top, 12) + 8 }]}>
        <View style={styles.searchRow}>
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
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={19} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {availableServiceFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.categoryChip, serviceFilter === filter.key && styles.categoryChipActive]}
              onPress={() => setServiceFilter(filter.key)}
            >
              <Text style={[styles.categoryChipText, serviceFilter === filter.key && styles.categoryChipTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>

      <View style={[styles.mapActions, { bottom: Math.max(insets.bottom, 16) + (cardEvent || showEventList ? height * 0.5 : 8) + 64 }]}>
        <TouchableOpacity style={styles.mapActionButton} onPress={recenterMap}>
          <Ionicons name="locate" size={21} color={theme.COLORS.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.listViewButton,
          { bottom: Math.max(insets.bottom, 16) + (cardEvent || showEventList ? height * 0.5 : 8) },
        ]}
        onPress={() => setShowEventList((current) => !current)}
      >
        <Ionicons name={showEventList ? "map-outline" : "list"} size={20} color="#ffffff" />
        <Text style={styles.listViewButtonText}>{showEventList ? "Map View" : "List View"}</Text>
      </TouchableOpacity>

      {showEventList || cardEvent ? (
        <View style={[styles.bottomCard, { bottom: Math.max(insets.bottom, 16) + 8 }]}>
        {showEventList ? (
          <View>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>
                  Nearby Places
                </Text>
                <Text style={styles.listSubtitle}>
                  {visibleEvents.length} {visibleEvents.length === 1 ? "place" : "places"} found
                </Text>
              </View>
              <TouchableOpacity style={styles.listCloseButton} onPress={() => setShowEventList(false)}>
                <Ionicons name="close" size={19} color={theme.COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.eventList}>
              {offersLoading ? (
                <View style={styles.listLoadingState}>
                  <ActivityIndicator size="small" color={theme.COLORS.primary} />
                  <Text style={styles.listLoadingText}>Loading nearby places...</Text>
                </View>
              ) : visibleEvents.map((event) => (
                <TouchableOpacity
                  key={`${event.entityType}-${event.id}`}
                  style={styles.eventListItem}
                  activeOpacity={0.85}
                  onPress={() => selectMapEvent(event)}
                >
                  {event.imageUrl ? (
                    <Image source={{ uri: event.imageUrl }} style={styles.eventListImage} />
                  ) : (
                    <View style={[styles.eventListImage, styles.eventListImageFallback]}>
                      <Ionicons name={event.entityType === "restaurant" ? "restaurant" : event.entityType === "hotel" ? "business" : event.entityType === "spa" ? "sparkles" : event.entityType === "happy_hour" ? "pricetag" : "calendar"} size={22} color="#ffffff" />
                    </View>
                  )}
                  <View style={styles.eventListBody}>
                    <Text style={styles.eventListTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventListOffer} numberOfLines={1}>{event.tag || event.time}</Text>
                    <Text style={styles.eventListMeta} numberOfLines={1}>
                      {event.distance} Â· {event.venue}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
              {!offersLoading && !visibleEvents.length ? (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={28} color="#94a3b8" />
                  <Text style={styles.noResultsTitle}>No matching places</Text>
                  <Text style={styles.noResultsText}>Try another search or explore a different area.</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : cardEvent ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardScrollContent}>
            {selectedEventLoading ? (
              <View style={styles.inlineLoadingRow}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading event details...</Text>
              </View>
            ) : null}

            {cardEvent.imageUrl ? (
              <Image source={{ uri: cardEvent.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroImageFallback}>
                <Ionicons name="calendar" size={28} color={theme.COLORS.white} />
              </View>
            )}

            <View style={styles.headerTextBlock}>
              <Text style={styles.offerTitle} numberOfLines={2}>
                {cardEvent.title}
              </Text>
              <Text style={styles.offerSubtitle} numberOfLines={1}>
                {cardEvent.tag ?? "Active event"}
              </Text>
            </View>

            <View style={styles.routeSummaryCard}>
              <View style={styles.routeSummaryHeader}>
                <Ionicons name="location-outline" size={18} color={theme.COLORS.primary} />
                <Text style={styles.routeSummaryTitle} numberOfLines={1}>
                  {cardEvent.venue ?? "Event location"}
                </Text>
              </View>
              <Text style={styles.routeSummaryAddress} numberOfLines={2}>
                {routeLocationText}
              </Text>
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
                <Text style={styles.infoLabel}>Booking</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {resolvedBookingStatusText}
                </Text>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {cardEvent.venue ?? "Venue available"}
                </Text>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>
                  {cardEvent.entityType === "happy_hour" ? "Offer price" : "Ticket"}
                </Text>
                <Text style={styles.infoValue}>
                  {cardEvent.ticketPrice != null ? cardEvent.ticketPrice : "Check details"}
                </Text>
              </View>
            </View>

            {cardEvent.description ? (
              <Text style={styles.descriptionText} numberOfLines={3}>
                {cardEvent.description}
              </Text>
            ) : null}

            <View style={styles.bookingRow}>
              {canShowInlineBooking ? (
                <View style={styles.quantityCard}>
                  <Text style={styles.quantityLabel}>Tickets</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setTicketQuantity((current) => Math.max(1, current - 1))}
                      disabled={bookingState.loading}
                    >
                      <Ionicons name="remove" size={16} color={theme.COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{ticketQuantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setTicketQuantity((current) => Math.min(20, current + 1))}
                      disabled={bookingState.loading}
                    >
                      <Ionicons name="add" size={16} color={theme.COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.bookNowButton,
                  resolvedBookingCode ? styles.bookedButton : null,
                  cardEvent?.isSoldOut && !resolvedBookingCode ? styles.disabledButton : null,
                ]}
                onPress={handleBookNow}
                disabled={bookingState.loading || (cardEvent?.isSoldOut && !resolvedBookingCode)}
              >
                {bookingState.loading ? (
                  <ActivityIndicator size="small" color={theme.COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name={
                        resolvedBookingCode
                          ? "receipt-outline"
                          : cardEvent?.isSoldOut
                            ? "ban-outline"
                            : canShowInlineBooking
                              ? "ticket-outline"
                              : "open-outline"
                      }
                      size={18}
                      color={theme.COLORS.white}
                    />
                    <Text style={styles.bookNowButtonText}>{primaryActionLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={openEventDetails}>
                <Ionicons name="information-circle-outline" size={18} color="#1d4ed8" />
                <Text style={styles.secondaryButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
                <Ionicons name="navigate" size={18} color={theme.COLORS.white} />
                <Text style={styles.directionsButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  locationLoadingState: {
    flex: 1,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  locationLoadingTitle: {
    marginTop: 14,
    color: theme.COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  locationLoadingText: {
    marginTop: 7,
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  locationRetryButton: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  locationRetryText: {
    color: theme.COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  eventMarkerWrap: {
    minWidth: 104,
    alignItems: "center",
  },
  eventMarkerTitle: {
    maxWidth: 170,
    marginBottom: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  eventMarkerTitleActive: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primary,
  },
  eventMarkerTitleText: {
    maxWidth: 148,
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "800",
  },
  eventMarkerTitleTextActive: {
    color: "#ffffff",
  },
  eventMarkerRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
    padding: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 6,
  },
  eventMarkerRingActive: {
    borderColor: theme.COLORS.primary,
    transform: [{ scale: 1.12 }],
  },
  eventMarkerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
  },
  eventMarkerFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.primary,
  },
  eventMarkerEventIcon: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  cloudOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 999,
  },
  cloudWrapper: {
    position: "absolute",
    opacity: 0.7,
  },
  spinnerOverCloud: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -18,
    zIndex: 100,
  },
  cloudIconShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  mapHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    justifyContent: "center",
    alignItems: "center",
    ...theme.SHADOWS.card,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...theme.SHADOWS.card,
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
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...theme.SHADOWS.card,
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
    backgroundColor: "rgba(255, 255, 255, 0.96)",
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
  mapActions: {
    position: "absolute",
    right: 16,
  },
  mapActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    ...theme.SHADOWS.card,
  },
  listViewButton: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    minWidth: 126,
    height: 52,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: theme.COLORS.primary,
    ...theme.SHADOWS.primary,
  },
  listViewButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 72,
  },
  loadingText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  inlineLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  bottomCard: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 30,
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 16,
    maxHeight: height * 0.5,
    elevation: 30,
    ...theme.SHADOWS.primary,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  listTitle: {
    color: theme.COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "900",
  },
  listSubtitle: {
    marginTop: 2,
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  listCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  eventList: {
    maxHeight: height * 0.34,
  },
  listLoadingState: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  listLoadingText: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  eventListItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  eventListImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
  },
  eventListImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.primary,
  },
  eventListBody: {
    flex: 1,
  },
  eventListTitle: {
    color: theme.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  eventListOffer: {
    marginTop: 3,
    color: "#b45309",
    fontSize: 12,
    fontWeight: "800",
  },
  eventListMeta: {
    marginTop: 4,
    color: theme.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  noResults: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noResultsTitle: {
    marginTop: 10,
    color: theme.COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  noResultsText: {
    marginTop: 5,
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  cardScrollContent: {
    paddingBottom: 4,
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    height: 144,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    marginBottom: 14,
  },
  heroImageFallback: {
    width: "100%",
    height: 144,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  headerTextBlock: {
    marginBottom: 14,
  },
  bottomOfferImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#cbd5e1",
  },
  offerTitle: {
    fontSize: 18,
    color: theme.COLORS.textPrimary,
    fontWeight: "800",
  },
  offerSubtitle: {
    fontSize: 13,
    color: theme.COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  routeSummaryCard: {
    marginTop: 14,
    marginBottom: 14,
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
  routeSummaryAddress: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: theme.COLORS.textSecondary,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  infoTile: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontSize: 13,
    lineHeight: 19,
    color: theme.COLORS.textSecondary,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  metricPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricText: {
    color: theme.COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  quantityCard: {
    width: 110,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.white,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  bookNowButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...theme.SHADOWS.primary,
  },
  bookedButton: {
    backgroundColor: "#16a34a",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  bookNowButtonText: {
    color: theme.COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
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
    backgroundColor: "#2563eb",
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    ...theme.SHADOWS.primary,
  },
  directionsButtonText: {
    color: theme.COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});

