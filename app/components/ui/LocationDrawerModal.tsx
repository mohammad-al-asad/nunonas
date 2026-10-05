// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NativeGoogleMap from "./NativeGoogleMap";
import theme from "../../constants/theme";
import { reverseGeocode } from "../../lib/google-maps";
import { getCurrentCoords, isExpectedLocationError } from "../../lib/location";

const LocationDrawerModal = ({ visible, onClose, onSelectLocation, currentLocation }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [address, setAddress] = useState(currentLocation || "Select a location");
  const [loading, setLoading] = useState(true);

  const presentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      presentedRef.current = true;
      sheetRef.current?.present();
    } else if (presentedRef.current) {
      // Only dismiss a sheet that was presented: dismissing one that never opened
      // leaves @gorhom/bottom-sheet stuck in a "dismissing" state, and every later
      // present() is ignored.
      presentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    presentedRef.current = false;
    onClose();
  };

  useEffect(() => {
    if (!visible) return;
    let active = true;
    async function getCoords() {
      try {
        setLoading(true);
        const coords = await getCurrentCoords();
        if (!coords || !active) return;
        setGpsCoords({ latitude: coords.latitude, longitude: coords.longitude });

        const addr = await reverseGeocode(coords.latitude, coords.longitude);
        if (addr && active) {
          setAddress(addr);
          onSelectLocation?.(addr);
        }
      } catch (e) {
        if (!isExpectedLocationError(e)) console.warn(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    getCoords();
    return () => {
      active = false;
    };
  }, [visible]);

  const openLiveMap = () => {
    onClose();
    router.push("/map");
  };

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />,
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      // Let the map pan freely; the sheet is dragged by its handle.
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.grabber}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Location Details</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => sheetRef.current?.dismiss()} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={theme.COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.mapPreview}>
            {loading && !gpsCoords ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="small" color={theme.COLORS.primary} />
              </View>
            ) : !gpsCoords ? (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="location-outline" size={28} color={theme.COLORS.primary} />
                <Text style={styles.locationUnavailableText}>Enable location to preview your area.</Text>
              </View>
            ) : (
              <NativeGoogleMap center={gpsCoords} zoomLevel={15} />
            )}

            <TouchableOpacity style={styles.openMapBtn} activeOpacity={0.9} onPress={openLiveMap}>
              <Ionicons name="map" size={16} color={theme.COLORS.white} />
              <Text style={styles.openMapBtnText}>Open Live Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.locationInfo}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={theme.COLORS.primary} />
                <Text style={styles.locationLabel}>Active location</Text>
              </View>
              <Text style={styles.locationText} numberOfLines={2}>
                {address}
              </Text>
            </View>
            <TouchableOpacity style={styles.navigateBtn} onPress={openLiveMap} accessibilityLabel="Open live map">
              <Ionicons name="navigate-outline" size={18} color={theme.COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  grabber: {
    width: 44,
    height: 5,
    backgroundColor: theme.COLORS.border,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.surface,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
    overflow: "hidden",
  },
  mapPreview: {
    height: 210,
    width: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.surface,
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
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.COLORS.primary,
    ...theme.SHADOWS.primary,
  },
  openMapBtnText: {
    color: theme.COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationLabel: {
    color: theme.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  locationText: {
    color: theme.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  navigateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
  },
});

export default LocationDrawerModal;
