import { View, StyleSheet, TouchableOpacity, Text, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../../constants/theme";
import Button from "../../../../ui/Button";
import { openUberRide } from "../../../../../lib/uber";

type DetailsActionsProps = {
  restaurantId?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  title?: string | null;
  address?: string | null;
};

export default function DetailsActions({
  restaurantId,
  phone,
  latitude,
  longitude,
  title,
  address,
}: DetailsActionsProps) {
  const router = useRouter();

  const handleCall = () => {
    const rawPhone = (phone || "").trim();
    if (!rawPhone) {
      Alert.alert("Contact Unavailable", "This restaurant does not have a contact phone number listed.");
      return;
    }

    const cleanNumber = rawPhone.replace(/[^\d+]/g, "");
    const telUrl = `tel:${cleanNumber || rawPhone}`;

    Linking.openURL(telUrl).catch(() => {
      Alert.alert("Call Failed", `Unable to place a call to ${rawPhone}.`);
    });
  };

  const handleUber = () => {
    openUberRide({
      latitude,
      longitude,
      title,
      address,
    });
  };

  return (
    <View style={styles.container}>
      <Button
        title="Book a Table"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/home/dining/booking",
            params: restaurantId ? { id: restaurantId } : undefined,
          })
        }
        style={styles.bookBtn}
        textStyle={styles.bookBtnText}
      />

      <TouchableOpacity
        style={styles.callBtn}
        onPress={handleCall}
        activeOpacity={0.7}
        accessibilityLabel="Call Restaurant"
      >
        <Ionicons name="call" size={20} color={theme.COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uberBtn}
        onPress={handleUber}
        activeOpacity={0.8}
        accessibilityLabel="Book Uber Ride"
      >
        <Text style={styles.uberText}>Uber</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  bookBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    ...theme.SHADOWS.primary,
  },
  bookBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  callBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  uberBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.COLORS.black,
    justifyContent: "center",
    alignItems: "center",
  },
  uberText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});


