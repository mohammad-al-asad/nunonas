// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import { listHotelRooms } from "../../../../../lib/customer-api";

const HotelRoomsContent = ({ hotelId }) => {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const data = await listHotelRooms(hotelId);
        setRooms(data || []);
      } catch (err) {
        console.error("Failed to fetch rooms from API:", err);
      } finally {
        setLoading(false);
      }
    }
    if (hotelId) fetchRooms();
  }, [hotelId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40 }]}>
        <ActivityIndicator size="small" color="#1e3a8a" />
      </View>
    );
  }

  if (rooms.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40 }]}>
        <Text style={{ fontWeight: "700", color: "#64748b" }}>No rooms available at this time.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rooms.map((room) => {
        const imageSource = typeof room.image === "string" ? { uri: room.image } : room.image;
        return (
          <View key={room.id} style={styles.roomCard}>
            <View style={styles.cardHeader}>
              <Image source={imageSource} style={styles.roomImage} />
              <View style={styles.headerRight}>
                <Text style={styles.roomTitle}>{room.title}</Text>
                <Text style={styles.bedText}>{room.bed}</Text>

                <View style={styles.occupancyRow}>
                  <Ionicons name="people" size={16} color="#94a3b8" />
                  <Ionicons
                    name="people"
                    size={16}
                    color="#94a3b8"
                    style={{ marginLeft: -4 }}
                  />
                  <Text style={styles.occupancyText}>{room.guests}</Text>
                </View>

                <View style={styles.amenityIcons}>
                  <Ionicons name="wifi" size={16} color="#1e3a8a" />
                  <MaterialCommunityIcons
                    name="snowflake"
                    size={16}
                    color="#1e3a8a"
                  />
                  <MaterialCommunityIcons
                    name="bathtub-outline"
                    size={16}
                    color="#1e3a8a"
                  />
                  <MaterialCommunityIcons
                    name="television"
                    size={16}
                    color="#1e3a8a"
                  />
                </View>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.cancellationBadge}>
                <Text style={styles.cancellationText}>Free Cancellation</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewDetailsRow}
              onPress={() => router.push(`/home/hotels/room/${room.id}`)}
            >
              <Text style={styles.viewDetailsText}>View details</Text>
              <Ionicons name="chevron-down" size={16} color="#1e3a8a" />
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.perNightLabel}>Per night</Text>
                <Text style={styles.priceText}>${room.price}</Text>
                <Text style={styles.totalText}>
                  Total: ${room.totalPrice} ({room.nights})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => router.push(`/home/hotels/room/${room.id}`)}
              >
                <Text style={styles.bookBtnText}>Book Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f8fafc",
  },
  roomCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 16,
  },
  roomImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    resizeMode: "cover",
  },
  headerRight: {
    flex: 1,
    justifyContent: "space-between",
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  bedText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  occupancyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  occupancyText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 4,
  },
  amenityIcons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  badgeRow: {
    marginTop: 16,
  },
  cancellationBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  cancellationText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "600",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#1e3a8a",
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  perNightLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginVertical: 2,
  },
  totalText: {
    fontSize: 12,
    color: "#64748b",
  },
  bookBtn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default HotelRoomsContent;


