// @ts-nocheck
import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";

const HotelDetailsActions = ({ hotelId }) => {
  const router = useRouter();

  const handleBookNow = () => {
    router.push({
      pathname: "/home/hotels/booking",
      params: { id: hotelId },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bookBtn}
        activeOpacity={0.8}
        onPress={handleBookNow}
      >
        <Text style={styles.bookBtnText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    gap: 12,
  },
  bookBtn: {
    flex: 1,
    height: 54,
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bookBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default HotelDetailsActions;


