// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NativeMapboxMap from "./NativeMapboxMap";
import theme from "../../constants/theme";
import { reverseGeocode } from "../../lib/google-maps";
import { getCurrentCoords, isExpectedLocationError } from "../../lib/location";

const { width, height } = Dimensions.get("window");

const LocationDrawerModal = ({ visible, onClose, onSelectLocation, currentLocation }) => {
  const router = useRouter();
  const [gpsCoords, setGpsCoords] = useState(null);
  const [address, setAddress] = useState(currentLocation || "Select a location");
  const [loading, setLoading] = useState(true);

  // PanResponder to detect swipe gestures on the grabber bar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -40) {
          // Swipe Up: Open live map
          onClose();
          router.push("/map");
        } else if (gestureState.dy > 40) {
          // Swipe Down: Close modal
          onClose();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      async function getCoords() {
        try {
          setLoading(true);
          const coords = await getCurrentCoords();
          if (!coords) {
            return;
          }

          setGpsCoords({ latitude: coords.latitude, longitude: coords.longitude });

          const addr = await reverseGeocode(coords.latitude, coords.longitude);
          if (addr) {
            setAddress(addr);
            if (onSelectLocation) {
              onSelectLocation(addr);
            }
          }
        } catch (e) {
          if (!isExpectedLocationError(e)) {
            console.warn(e);
          }
        } finally {
          setLoading(false);
        }
      }
      getCoords();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Grabber bar / Drag indicator with Gesture Handlers */}
          <View style={styles.grabberContainer} {...panResponder.panHandlers}>
            <View style={styles.grabber} />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Location Details</Text>

            {/* Custom React Native Card Component */}
            <View style={styles.card}>
              {/* Map Preview section */}
              <View style={styles.mapPreviewContainer}>
                {loading ? (
                  <View style={styles.mapPlaceholder}>
                    <ActivityIndicator size="small" color={theme.COLORS.primary} />
                  </View>
                ) : !gpsCoords ? (
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="location-outline" size={28} color={theme.COLORS.primary} />
                    <Text style={styles.locationUnavailableText}>Enable location to preview your area.</Text>
                  </View>
                ) : (
                  <NativeMapboxMap center={gpsCoords} height={230} zoomLevel={14} />
                )}

                {/* Open Live Map Button (Overlaid on Map Preview) */}
                <TouchableOpacity
                  style={styles.openMapBtn}
                  activeOpacity={0.9}
                  onPress={() => {
                    onClose();
                    router.push("/map");
                  }}
                >
                  <Ionicons name="map" size={18} color={theme.COLORS.white} />
                  <Text style={styles.openMapBtnText}>Open Live Map</Text>
                </TouchableOpacity>
              </View>

              {/* Card Details Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.locationInfo}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={18} color={theme.COLORS.primary} />
                    <Text style={styles.locationLabel}>Active Location</Text>
                  </View>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {address}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.refreshBtn}
                  onPress={() => {
                    onClose();
                    router.push("/map");
                  }}
                >
                  <Ionicons name="navigate-outline" size={18} color={theme.COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: "100%",
    maxHeight: height * 0.85,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    ...theme.SHADOWS.card,
    position: "relative",
  },
  grabberContainer: {
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
  },
  grabber: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E2E8F0", // Slate-200
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 15,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    overflow: "hidden",
    marginBottom: 24,
    ...theme.SHADOWS.card,
  },
  mapPreviewContainer: {
    height: 200,
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
    borderRadius: 24,
    bottom: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    ...theme.SHADOWS.primary,
    zIndex: 99,
  },
  openMapBtnText: {
    color: theme.COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  locationInfo: {
    flex: 1,
    gap: 6,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  locationLabel: {
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  locationText: {
    color: theme.COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  refreshBtn: {
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  markerFixed: {
    left: "50%",
    marginLeft: -16,
    marginTop: -32,
    position: "absolute",
    top: "50%",
    zIndex: 10,
  },
});

export default LocationDrawerModal;


