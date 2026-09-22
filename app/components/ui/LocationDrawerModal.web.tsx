// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../constants/theme";
import { reverseGeocode } from "../../lib/google-maps";
import { getCurrentCoords, isExpectedLocationError } from "../../lib/location";
import GoogleWebMap from "./GoogleWebMap";

const LocationDrawerModal = ({ visible, onClose, onSelectLocation, currentLocation }) => {
  const router = useRouter();
  const [address, setAddress] = useState(currentLocation || "Location unavailable");
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    async function loadAddress() {
      try {
        setLoading(true);
        const coords = await getCurrentCoords();
        if (!coords) {
          return;
        }

        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        const nextAddress = await reverseGeocode(coords.latitude, coords.longitude);
        if (nextAddress) {
          setAddress(nextAddress);
          onSelectLocation?.(nextAddress);
        }
      } catch (error) {
        if (!isExpectedLocationError(error)) {
          console.warn(error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAddress();
  }, [visible, onSelectLocation]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Location Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.preview}>
              {coordinates ? (
                <GoogleWebMap center={coordinates} height={230} zoomLevel={14} />
              ) : (
                <View style={styles.mapPlaceholder}>
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="location-outline" size={28} color={theme.COLORS.primary} />
                      <Text style={styles.locationUnavailableText}>Enable location to preview your area.</Text>
                    </>
                  )}
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <View style={styles.locationBlock}>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={theme.COLORS.primary} />
                  <Text style={styles.locationLabel}>Active Location</Text>
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={theme.COLORS.primary} />
                ) : (
                  <Text style={styles.locationText}>{address}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  onClose?.();
                  router.push("/map");
                }}
              >
                <Ionicons name="map-outline" size={16} color={theme.COLORS.white} />
                <Text style={styles.actionText}>Open Map Screen</Text>
              </TouchableOpacity>
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
  },
  sheet: {
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 28,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: theme.COLORS.white,
  },
  preview: {
    height: 230,
    backgroundColor: "#eff6ff",
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  locationUnavailableText: {
    marginTop: 8,
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    textAlign: "center",
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  footer: {
    padding: 20,
    gap: 16,
  },
  locationBlock: {
    gap: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
    textTransform: "uppercase",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  actionButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionText: {
    color: theme.COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default LocationDrawerModal;


