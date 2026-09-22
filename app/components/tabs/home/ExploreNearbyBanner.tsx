// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  Linking,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NativeMapboxMap from "../../ui/NativeMapboxMap";
import theme from "../../../constants/theme";
import {
  buildDirectionsUrl,
  getDrivingRoute,
  reverseGeocode,
} from "../../../lib/google-maps";
import { getCurrentCoords, isExpectedLocationError } from "../../../lib/location";
import { listNearbyMapPins } from "../../../lib/nearby-offers";
import { updateCurrentLocation } from "../../../lib/customer-api";
import { formatDistanceKm } from "../../../lib/distance";

const { width } = Dimensions.get("window");

function getDistanceLabel(offer, routeInfo) {
  if (routeInfo?.distanceText) {
    return routeInfo.distanceText;
  }

  if (typeof offer?.distanceKm === "number") {
    return formatDistanceKm(offer.distanceKm, " nearby") ?? "Nearby";
  }

  return "Nearby";
}

function getCardLabel(item) {
  return item?.entityType === "event" || item?.category === "event"
    ? "Selected Event"
    : "Selected Offer";
}

function OfferMarker({ offer, onPress, active }) {
  return (
      <View style={styles.markerWrap}>
        <View style={[styles.markerTitleChip, active && styles.markerTitleChipActive]}>
          <Text
            style={[styles.markerTitleText, active && styles.markerTitleTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {offer.title}
          </Text>
        </View>
        <View style={[styles.markerImageRing, active && styles.markerImageRingActive]}>
          {offer.entityType === "event" ? (
            <View style={[styles.markerImage, styles.eventMarkerIcon]}>
              <MaterialIcons
                name="event-note"
                size={26}
                color={theme.COLORS.primary}
              />
            </View>
          ) : offer.imageUrl ? (
            <Image source={{ uri: offer.imageUrl }} style={styles.markerImage} />
          ) : (
            <View style={[styles.markerImage, styles.markerFallback]}>
              <Ionicons name="business" size={18} color={theme.COLORS.white} />
            </View>
          )}
        </View>
        <View style={styles.markerOfferChip}>
          <Text style={styles.markerOfferText} numberOfLines={1}>
            {offer.offerText}
          </Text>
        </View>
      </View>
  );
}

function NearbyMap({ gpsCoords, markerOffers, selectedOffer, setSelectedOffer, style, onPullToRefresh }) {
  return (
    <View style={style}>
      <NativeMapboxMap
        center={gpsCoords}
        zoomLevel={13}
        onPullToRefresh={onPullToRefresh}
        markers={markerOffers.map((offer) => ({
          id: `nearby-event-${offer.id}`,
          kind: offer.entityType === "event" ? "event" : offer.entityType === "happy_hour" ? "happy_hour" : offer.serviceType === "spa" ? "spa" : offer.serviceType === "hotel" ? "hotel" : "restaurant",
          coordinate: { latitude: Number(offer.latitude), longitude: Number(offer.longitude) },
          onPress: () => setSelectedOffer(offer),
          children: <OfferMarker offer={offer} active={selectedOffer?.id === offer.id} />,
        }))}
      />
    </View>
  );
}

const ExploreNearbyBanner = ({ refreshToken = 0, onPullToRefresh }) => {
  const router = useRouter();
  // Start collapsed: the compact map/footer is the default home view.
  // Tapping the top chevron opens the expanded offer panel.
  const [showMap, setShowMap] = useState(true);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [address, setAddress] = useState("Location unavailable");
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    async function getCoords() {
      try {
        setLoading(true);
        const coords = await getCurrentCoords();
        if (!coords) {
          return;
        }

        setGpsCoords({ latitude: coords.latitude, longitude: coords.longitude });

        // Keep the server-side origin in sync before requesting nearby data.
        // The customer endpoints calculate distance from these coordinates.
        await updateCurrentLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_accuracy_meters: coords.accuracy ?? undefined,
          location_enabled: true,
        });

        const addr = await reverseGeocode(coords.latitude, coords.longitude);
        if (addr) {
          setAddress(addr);
        }
      } catch (e) {
        if (!isExpectedLocationError(e)) {
          console.warn("Error fetching coords for map card: ", e);
        }
      } finally {
        setLoading(false);
      }
    }

    async function getOffers() {
      try {
        setOffersLoading(true);
        const items = await listNearbyMapPins(50);
        setOffers(items);
        setSelectedOffer(items[0] ?? null);
      } catch (error) {
        console.warn("Error loading nearby offers: ", error);
        setOffers([]);
        setSelectedOffer(null);
      } finally {
        setOffersLoading(false);
      }
    }

    // Location must be persisted before the nearby request, otherwise the
    // first render can be sorted using the previous/stale customer location.
    (async () => {
      await getCoords();
      await getOffers();
    })();
  }, [refreshToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (!gpsCoords || !selectedOffer) {
        setRouteInfo(null);
        return;
      }

      const route = await getDrivingRoute(gpsCoords, {
        latitude: selectedOffer.latitude,
        longitude: selectedOffer.longitude,
      });

      if (!cancelled) {
        setRouteInfo(route);
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [gpsCoords, selectedOffer]);

  const openMap = () => {
    const params = selectedOffer?.id ? { offerId: selectedOffer.id } : undefined;
    router.push(params ? { pathname: "/map", params } : "/map");
  };

  const openDirections = async () => {
    if (!gpsCoords || !selectedOffer) {
      openMap();
      return;
    }

    const url = buildDirectionsUrl(gpsCoords, {
      latitude: selectedOffer.latitude,
      longitude: selectedOffer.longitude,
    });

    if (!url) {
      openMap();
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      router.push({
        pathname: "/map",
        params: { offerId: selectedOffer.id },
      });
    }
  };

  // Keep every valid nearby public item on the Home map. The full map endpoint
  // already scopes visibility and returns restaurants, hotels, spas, events,
  // and Happy Hours with coordinates.
  const markerOffers = offers;

  if (showMap) {
    return (
      <View style={styles.container}>
        <View style={styles.mapCard}>
          <View style={styles.mapPreviewContainer}>
            {loading || offersLoading ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="small" color={theme.COLORS.primary} />
              </View>
            ) : !gpsCoords ? (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="location-outline" size={28} color={theme.COLORS.primary} />
                <Text style={styles.locationUnavailableText}>Enable location to view nearby events.</Text>
              </View>
            ) : (
              <NearbyMap gpsCoords={gpsCoords} markerOffers={markerOffers} selectedOffer={selectedOffer} setSelectedOffer={setSelectedOffer} onPullToRefresh={onPullToRefresh} style={styles.staticMap} />
            )}

            <TouchableOpacity
              style={styles.topRightToggleBtn}
              onPress={() => setShowMap(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={20} color="#1e3a8a" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.openMapBtn} activeOpacity={0.9} onPress={openMap}>
              <Ionicons name="map" size={16} color={theme.COLORS.white} />
              <Text style={styles.openMapBtnText}>Open Full Map</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bannerCard}>
        {loading || offersLoading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="small" color={theme.COLORS.primary} />
          </View>
        ) : !gpsCoords ? (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location-outline" size={28} color={theme.COLORS.primary} />
            <Text style={styles.locationUnavailableText}>Enable location to view nearby events.</Text>
          </View>
        ) : (
          <NearbyMap gpsCoords={gpsCoords} markerOffers={markerOffers} selectedOffer={selectedOffer} setSelectedOffer={setSelectedOffer} style={StyleSheet.absoluteFillObject} />
        )}

        <TouchableOpacity
          style={styles.topRightToggleBtn}
          onPress={() => setShowMap(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={20} color="#1e3a8a" />
        </TouchableOpacity>

        <View style={styles.overlaidCard}>
          <Text style={styles.title}>Explore Nearby Offers</Text>
          <Text style={styles.sparkles}>Nearby on the road, not just by pin</Text>

          <Text style={styles.description}>
            Explore restaurants, hotels, spas, events, and Happy Hours nearby.
          </Text>

          {selectedOffer ? (
            <View style={styles.selectedOfferCard}>
              <View style={styles.selectedOfferHeader}>
                {selectedOffer.imageUrl ? (
                  <Image source={{ uri: selectedOffer.imageUrl }} style={styles.selectedOfferImage} />
                ) : (
                  <View style={[styles.selectedOfferImage, styles.markerFallback]}>
                    <Ionicons name="business" size={18} color={theme.COLORS.white} />
                  </View>
                )}
                <View style={styles.selectedOfferTextWrap}>
                  <Text style={styles.selectedOfferTitle} numberOfLines={1}>
                    {selectedOffer.title}
                  </Text>
                  <Text style={styles.selectedOfferSubtitle} numberOfLines={1}>
                    {selectedOffer.offerText}
                  </Text>
                  <Text style={styles.selectedOfferMeta} numberOfLines={1}>
                    {getDistanceLabel(selectedOffer, routeInfo)}
                    {routeInfo?.durationText ? ` - ${routeInfo.durationText}` : ""}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={openDirections}>
              <Ionicons name="navigate-outline" size={16} color={theme.COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={openMap}>
              <Ionicons name="map-outline" size={16} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Open Live Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  bannerCard: {
    height: 360,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e2ebd9",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
  },
  markerWrap: {
    alignItems: "center",
    minWidth: 84,
  },
  markerTitleChip: {
    maxWidth: width * 0.48,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
  markerTitleChipActive: {
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primary,
  },
  markerTitleText: {
    maxWidth: width * 0.42,
    color: "#0f172a",
    fontSize: 10,
    fontWeight: "800",
  },
  markerTitleTextActive: {
    color: "#ffffff",
  },
  markerImageRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.COLORS.white,
    padding: 3,
    borderWidth: 2,
    borderColor: theme.COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  markerImageRingActive: {
    borderColor: theme.COLORS.primary,
    transform: [{ scale: 1.05 }],
  },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "#cbd5e1",
  },
  markerFallback: {
    alignItems: "center",
    backgroundColor: theme.COLORS.primary,
    justifyContent: "center",
  },
  eventMarkerIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  markerOfferChip: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    maxWidth: width * 0.42,
  },
  markerOfferText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  topRightToggleBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#ffffff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 100,
  },
  overlaidCard: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 2,
  },
  sparkles: {
    fontSize: 12,
    marginVertical: 4,
    color: "#2563eb",
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  selectedOfferCard: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedOfferHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedOfferImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#cbd5e1",
  },
  selectedOfferTextWrap: {
    flex: 1,
  },
  selectedOfferTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  selectedOfferSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
  selectedOfferMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
  actionRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    gap: 6,
  },
  secondaryButtonText: {
    color: theme.COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  button: {
    flex: 1.35,
    flexDirection: "row",
    backgroundColor: "#4285f4",
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#4285f4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  mapCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    overflow: "hidden",
    ...theme.SHADOWS.card,
  },
  mapPreviewContainer: {
    height: 220,
    position: "relative",
    width: "100%",
  },
  staticMap: {
    height: "100%",
    width: "100%",
  },
  mapPlaceholder: {
    alignItems: "center",
    backgroundColor: theme.COLORS.surface,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  locationUnavailableText: {
    marginTop: 8,
    paddingHorizontal: 20,
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  openMapBtn: {
    alignItems: "center",
    backgroundColor: theme.COLORS.primary,
    borderRadius: 20,
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "absolute",
    right: 12,
    ...theme.SHADOWS.primary,
    zIndex: 99,
  },
  openMapBtnText: {
    color: theme.COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  locationLabel: {
    color: theme.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  locationText: {
    color: theme.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  offerCaption: {
    color: theme.COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  distanceCaption: {
    color: theme.COLORS.textSecondary,
    fontSize: 12,
  },
  refreshBtn: {
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});

export default ExploreNearbyBanner;


