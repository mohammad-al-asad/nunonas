// @ts-nocheck
import React, { useCallback, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import theme from "../../../constants/theme";
import { showToast } from "../../../lib/toast";
import { logoutSession } from "../../../lib/auth-session";
import { getMe, getPointsSummary, updateNotificationPreferences } from "../../../lib/customer-api";

// Import Components
import ProfileMenuItem from "../../../components/tabs/profile/ProfileMenuItem";
import ProfileHeader from "../../../components/tabs/profile/ProfileHeader";
import BonusPointsCard from "../../../components/tabs/profile/BonusPointsCard";

// Helper Components
const ProfileHeaderSection = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const ProfileLinkItem = ({ title, onPress }) => (
  <TouchableOpacity
    style={styles.linkItem}
    activeOpacity={0.6}
    onPress={onPress}
  >
    <Text style={styles.linkText}>{title}</Text>
    <Ionicons
      name="chevron-forward"
      size={16}
      color={theme.COLORS.textSecondary}
    />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const [nearbyEvents, setNearbyEvents] = useState(false);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [profile, setProfile] = useState(null);
  const previousPointsRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        try {
          const [data, pointsSummary] = await Promise.all([getMe(), getPointsSummary()]);
          if (active) {
            const previousPoints = previousPointsRef.current;
            const currentPoints = Number(pointsSummary?.points_balance ?? data.points_balance ?? 0);
            setProfile({ ...data, points_balance: currentPoints });
            previousPointsRef.current = currentPoints;
            setNearbyEvents(data.notification_preferences.nearby_events);
            setBookingReminders(data.notification_preferences.booking_reminders);
            if (previousPoints != null && currentPoints > previousPoints) {
              showToast(`${currentPoints - previousPoints} bonus points added.`, { type: "success" });
            }
          }
        } catch (error) {
          if (active) {
            Alert.alert("Profile unavailable", error.message);
          }
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    await logoutSession();
    router.replace("/auth/login");
  };

  const updatePreference = async (key, value) => {
    const previous = key === "nearby_events" ? nearbyEvents : bookingReminders;
    if (key === "nearby_events") setNearbyEvents(value);
    else setBookingReminders(value);
    try {
      const updated = await updateNotificationPreferences({
        ...profile?.notification_preferences,
        [key]: value,
      });
      showToast("Notification settings updated.", { type: "success" });
      setProfile(updated);
    } catch (error) {
      if (key === "nearby_events") setNearbyEvents(previous);
      else setBookingReminders(previous);
      showToast(error?.message || "Could not save this preference.", { type: "error" });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header section */}
        <ProfileHeader
          name={profile?.full_name || "Your Profile"}
          email={profile?.email || profile?.phone || ""}
          imageUrl={profile?.profile_image_url}
          onEditPress={() => router.push("/profile/edit")}
        />

        {/* Bonus Points Card section */}
        <BonusPointsCard points={String(profile?.points_balance ?? 0)} />

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {/* My Bookings */}
          <ProfileHeaderSection title="My Bookings" />
          <ProfileMenuItem
            icon="calendar-outline"
            title="View all my bookings"
            onPress={() => router.push("/profile/bookings")}
          />

          {/* Your activity */}
          <ProfileHeaderSection title="Your activity" />
          <ProfileMenuItem
            icon="star-outline"
            title="Reviews"
            onPress={() => router.push("/profile/reviews")}
          />

          {/* About me */}
          <ProfileHeaderSection title="About me" />
          <ProfileMenuItem
            icon="person-outline"
            title="Personal details"
            onPress={() => router.push("/profile/edit")}
          />

          {/* Help Center */}
          <ProfileHeaderSection title="Help Center" />
          <ProfileMenuItem
            icon="headset-outline"
            title="Get support"
            onPress={() => router.push("/profile/support")}
          />

          {/* Notifications */}
          <ProfileHeaderSection title="Notifications" />
          <ProfileMenuItem
            icon="location-outline"
            title="Nearby events"
            switchValue={nearbyEvents}
            onSwitchChange={(value) => updatePreference("nearby_events", value)}
          />
          <ProfileMenuItem
            icon="notifications-outline"
            title="Booking reminders"
            switchValue={bookingReminders}
            onSwitchChange={(value) => updatePreference("booking_reminders", value)}
          />

          {/* Links */}
          <View style={styles.linksContainer}>
            <ProfileLinkItem title="Terms & Conditions" onPress={() => router.push("/profile/legal?doc=terms")} />
            <ProfileLinkItem title="Privacy Policy" onPress={() => router.push("/profile/legal?doc=privacy")} />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  linksContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
    paddingTop: 10,
  },
  linkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  logoutBtn: {
    marginTop: 40,
    alignItems: "center",
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.error,
  },
});


