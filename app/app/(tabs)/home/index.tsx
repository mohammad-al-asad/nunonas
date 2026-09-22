// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

// Import Home Components
import ExploreNearbyBanner from "../../../components/tabs/home/ExploreNearbyBanner";
import PlanForMeBanner from "../../../components/tabs/home/PlanForMeBanner";
import QuickAccess from "../../../components/tabs/home/QuickAccess";
import TrendingNow from "../../../components/tabs/home/TrendingNow";
import FeaturedExperiences from "../../../components/tabs/home/FeaturedExperiences";
import HomeSearchBar from "../../../components/tabs/home/HomeSearchBar";
import UpcomingBookings from "../../../components/tabs/home/UpcomingBookings";
import LocationDrawerModal from "../../../components/ui/LocationDrawerModal";
import { reverseGeocode } from "../../../lib/google-maps";
import { getCurrentCoords, isExpectedLocationError } from "../../../lib/location";
import { getMe, getUnreadNotificationCount, updateCurrentLocation } from "../../../lib/customer-api";
import { showToast } from "../../../lib/toast";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { addressUpdated, locationLoadingChanged, locationUpdated } from "../../../store/slices/locationSlice";
import { useQueryClient } from "@tanstack/react-query";
import { homeQueryKeys } from "../../../lib/queries/homeQueries";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function getFirstName(fullName) {
  const name = String(fullName ?? "").trim();
  return name ? name.split(/\s+/)[0] : "Nuno";
}

export default function HomeScreen() {
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mapRefreshToken, setMapRefreshToken] = useState(0);
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const locationText = useAppSelector((state) => state.location.address);
  const [greeting, setGreeting] = useState(getTimeGreeting);
  const [userName, setUserName] = useState("Nuno");
  const unreadNotifications = useRef(null);

  useEffect(() => {
    let active = true;
    getMe()
      .then((profile) => {
        if (active) setUserName(getFirstName(profile?.full_name));
      })
      .catch(() => {
        // Keep the friendly fallback when the profile request is unavailable.
      });

    const timer = setInterval(() => setGreeting(getTimeGreeting()), 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const checkNotifications = async () => {
      try {
        const payload = await getUnreadNotificationCount();
        const count = Number(payload?.count ?? payload?.unread_count ?? payload?.unreadCount ?? 0);
        if (active && unreadNotifications.current !== null && count > unreadNotifications.current) {
          showToast("You have a new notification.", { type: "info" });
        }
        if (active) unreadNotifications.current = count;
      } catch {
        // Notification polling is best effort and should not interrupt discovery.
      }
    };
    void checkNotifications();
    const timer = setInterval(checkNotifications, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    async function getUserLocation() {
      try {
        dispatch(locationLoadingChanged(true));
        const coords = await getCurrentCoords();
        if (!coords) return;

        await updateCurrentLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_accuracy_meters: coords.accuracy ?? undefined,
          location_enabled: true,
        });

        const address = await reverseGeocode(
          coords.latitude,
          coords.longitude
        );
        if (address) {
          dispatch(locationUpdated({
            coords: { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy },
            address,
          }));
        } else {
          dispatch(locationUpdated({
            coords: { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy },
          }));
        }
      } catch (error) {
        if (!isExpectedLocationError(error)) {
          console.warn("Could not retrieve current location: ", error);
        }
      }
      finally {
        dispatch(locationLoadingChanged(false));
      }
    }

    getUserLocation();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const coords = await getCurrentCoords();
      if (coords) {
        await updateCurrentLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_accuracy_meters: coords.accuracy ?? undefined,
          location_enabled: true,
        });
        const address = await reverseGeocode(coords.latitude, coords.longitude);
        dispatch(locationUpdated({
          coords: { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy },
          address: address || undefined,
        }));
      }
    } catch (error) {
      if (!isExpectedLocationError(error)) {
        console.warn("Could not refresh home location: ", error);
      }
    } finally {
      await queryClient.invalidateQueries({ queryKey: homeQueryKeys.all });
      setMapRefreshToken((value) => value + 1);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <TouchableOpacity 
            style={styles.locationSelector}
            onPress={() => setIsLocationModalVisible(true)}
          >
            <Ionicons name="location" size={20} color={theme.COLORS.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={theme.COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.COLORS.primary}
            colors={[theme.COLORS.primary]}
          />
        }
      >
        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{greeting}, {userName}!</Text>
          <Text style={styles.welcomeSubtitle}>
            What would you like to discover today?
          </Text>
        </View>

        <HomeSearchBar />

        {/* Components */}
        <ExploreNearbyBanner refreshToken={mapRefreshToken} onPullToRefresh={handleRefresh} />
        <PlanForMeBanner />
        <QuickAccess />
        <TrendingNow />
        <FeaturedExperiences />
        <UpcomingBookings />
      </ScrollView>

      {/* Location Selection Modal Component */}
      <LocationDrawerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectLocation={(address) => dispatch(addressUpdated(address))}
        currentLocation={locationText}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  locationContainer: {
    flex: 1,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  notificationDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.COLORS.error,
    borderWidth: 1.5,
    borderColor: theme.COLORS.white,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
  },
});


