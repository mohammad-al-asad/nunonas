// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import GoogleWebMap from "../../ui/GoogleWebMap";

function getDistanceLabel(offer, routeInfo) {
  if (routeInfo?.distanceText) {
    return routeInfo.distanceText;
  }

  if (typeof offer?.distanceKm === "number") {
    return formatDistanceKm(offer.distanceKm, " nearby") ?? "Nearby";
  }

  return "Nearby";
}

const ExploreNearbyBanner = () => {
  const router = useRouter();
  const [gpsCoords, setGpsCoords] = useState(null);
  const [address, setAddress] = useState("Location unavailable");
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    async function loadLocation() {
      try {
        setLoading(true);
        const coords = await getCurrentCoords();
        if (!coords) {
          return;
        }

        setGpsCoords({ latitude: coords.latitude, longitude: coords.longitude });
        await updateCurrentLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_accuracy_meters: coords.accuracy ?? undefined,
          location_enabled: true,
        });
        const nextAddress = await reverseGeocode(coords.latitude, coords.longitude);
        if (nextAddress) {
          setAddress(nextAddress);
        }
      } catch (error) {
        if (!isExpectedLocationError(error)) {
          console.warn("Error fetching coords for nearby offers:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    async function loadOffers() {
      try {
        setOffersLoading(true);
        const items = await listNearbyMapPins(50);
        setOffers(items);
        setSelectedOffer(items[0] ?? null);
      } catch (error) {
        console.warn("Error loading nearby offers:", error);
        setOffers([]);
        setSelectedOffer(null);
      } finally {
        setOffersLoading(false);
      }
    }

    (async () => {
      await loadLocation();
      await loadOffers();
    })();
  }, []);

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
      openMap();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bannerCard}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="map-outline" size={16} color="#1d4ed8" />
            <Text style={styles.heroBadgeText}>Live nearby map</Text>
          </View>
          <Text style={styles.title}>Explore Nearby Offers</Text>
          <Text style={styles.description}>
            Select an event thumbnail on the live map to see its details and driving distance.
          </Text>
        </View>

        {loading || offersLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={theme.COLORS.primary} />
            <Text style={styles.loadingText}>Loading nearby offers...</Text>
          </View>
        ) : !gpsCoords ? (
          <View style={styles.loadingState}>
            <Ionicons name="location-outline" size={30} color={theme.COLORS.primary} />
            <Text style={styles.loadingText}>Enable location to view nearby events.</Text>
          </View>
        ) : (
          <>
            <View style={styles.locationCard}>
              <Text style={styles.locationLabel}>Current area</Text>
              <Text style={styles.locationText}>{address}</Text>
            </View>

            <View style={styles.mapPreview}>
              <GoogleWebMap
                center={gpsCoords}
                markers={offers.map((offer) => ({
                  id: String(offer.id),
                  title: offer.title,
                  latitude: offer.latitude,
                  longitude: offer.longitude,
                  imageUrl: offer.imageUrl,
                  kind: offer.entityType,
                }))}
                selectedId={selectedOffer?.id ? String(selectedOffer.id) : null}
                onMarkerPress={(marker) => {
                  const offer = offers.find((item) => String(item.id) === marker.id);
                  if (offer) setSelectedOffer(offer);
                }}
                height={230}
              />
            </View>

            {selectedOffer ? (
              <View style={styles.selectedOfferCard}>
                <View style={styles.selectedOfferHeader}>
                  {selectedOffer.imageUrl ? (
                    <Image source={{ uri: selectedOffer.imageUrl }} style={styles.selectedOfferImage} />
                  ) : (
                    <View style={[styles.selectedOfferImage, styles.fallbackImage]}>
                      <Ionicons name="business" size={18} color={theme.COLORS.white} />
                    </View>
                  )}
                  <View style={styles.selectedOfferBody}>
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

                <View style={styles.offerChips}>
                  {offers.map((offer) => (
                    <TouchableOpacity
                      key={offer.id}
                      style={[
                        styles.offerChip,
                        selectedOffer.id === offer.id ? styles.offerChipActive : null,
                      ]}
                      onPress={() => setSelectedOffer(offer)}
                    >
                      <Text
                        style={[
                          styles.offerChipText,
                          selectedOffer.id === offer.id ? styles.offerChipTextActive : null,
                        ]}
                        numberOfLines={1}
                      >
                        {offer.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={openDirections}>
                <Ionicons name="navigate-outline" size={16} color={theme.COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={openMap}>
                <Ionicons name="map-outline" size={16} color={theme.COLORS.white} />
                <Text style={styles.primaryButtonText}>Open Live Map</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#e8f0ff",
    borderWidth: 1,
    borderColor: "#c7d7fe",
    gap: 14,
    ...theme.SHADOWS.card,
  },
  hero: {
    gap: 8,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d4ed8",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  loadingState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  locationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  mapPreview: {
    height: 230,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  selectedOfferCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 14,
  },
  selectedOfferHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedOfferImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#cbd5e1",
  },
  fallbackImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.primary,
  },
  selectedOfferBody: {
    flex: 1,
  },
  selectedOfferTitle: {
    fontSize: 15,
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
  offerChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  offerChip: {
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#eff6ff",
  },
  offerChipActive: {
    backgroundColor: theme.COLORS.primary,
  },
  offerChipText: {
    color: theme.COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  offerChipTextActive: {
    color: theme.COLORS.white,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  secondaryButtonText: {
    color: theme.COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1.2,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  primaryButtonText: {
    color: theme.COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default ExploreNearbyBanner;


