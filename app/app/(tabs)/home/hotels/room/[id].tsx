// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../../../constants/theme";
import { getHotelRoom } from "../../../../../lib/customer-api";

const { width } = Dimensions.get("window");

const CollapsibleSection = ({ title, children, isOpen, onToggle }) => (
  <View style={styles.section}>
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={isOpen ? "chevron-up" : "chevron-down"}
        size={20}
        color="#0f172a"
      />
    </TouchableOpacity>
    {isOpen && <View style={styles.sectionContent}>{children}</View>}
  </View>
);

const RoomDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeImage, setActiveImage] = useState(0);
  const [sections, setSections] = useState({
    amenities: true,
    price: true,
    policies: true,
  });
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    async function fetchRoom() {
      try {
        const data = await getHotelRoom(id);
        setRoomData(data);
      } catch (err) {
        console.error("Failed to fetch room details:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  if (!roomData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontWeight: "700", color: "#64748b" }}>Room details not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.header} edges={["top"]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rooms</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* Main Image */}
        {roomData.images?.length ? <View style={styles.imageContainer}>
          <Image
            source={typeof roomData.images[activeImage] === "string" ? { uri: roomData.images[activeImage] } : roomData.images[activeImage]}
            style={styles.mainImage}
          />
          <View style={styles.imageCounter}>
            <Text style={styles.counterText}>
              {activeImage + 1}/{roomData.images.length}
            </Text>
          </View>
        </View> : null}

        {/* Thumbnails */}
        {roomData.images?.length > 1 ? <View style={styles.thumbnailRow}>
          {roomData.images.map((img, index) => {
            const imgSource = typeof img === "string" ? { uri: img } : img;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setActiveImage(index)}
                style={[
                  styles.thumbnailWrap,
                  activeImage === index && styles.activeThumbnail,
                ]}
              >
                <Image source={imgSource} style={styles.thumbnail} />
              </TouchableOpacity>
            );
          })}
        </View> : null}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.roomTitle}>{roomData.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{roomData.status}</Text>
            </View>
          </View>

          {/* Provider-configured room details only */}
          <View style={styles.statsGrid}>
            {[
              roomData.size ? { icon: "arrow-expand-all", value: roomData.size } : null,
              roomData.guests ? { icon: "account-group-outline", value: roomData.guests } : null,
              roomData.bed ? { icon: "bed-king-outline", value: roomData.bed } : null,
              roomData.view ? { icon: "office-building-marker-outline", value: roomData.view } : null,
            ].filter(Boolean).map((item, index) => (
              <View key={`${item.value}-${index}`} style={styles.statItem}>
                <MaterialCommunityIcons name={item.icon} size={18} color="#64748b" />
                <Text style={styles.statText}>{item.value}</Text>
              </View>
            ))}
          </View>

          {roomData.amenities?.length ? <CollapsibleSection
            title="Room Amenities"
            isOpen={sections.amenities}
            onToggle={() => toggleSection("amenities")}
          >
            <View style={styles.amenitiesList}>
              {roomData.amenities.map((item, idx) => (
                <View key={idx} style={styles.amenityRow}>
                  <Ionicons name={item.icon} size={20} color="#1e3a8a" />
                  <Text style={styles.amenityText}>{item.name}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection> : null}

          <CollapsibleSection
            title="Price Breakdown"
            isOpen={sections.price}
            onToggle={() => toggleSection("price")}
          >
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Room rate (2 nights)</Text>
              <Text style={styles.priceValue}>${roomData.price.rate}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & fees</Text>
              <Text style={styles.priceValue}>${roomData.price.taxes}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${roomData.price.total}</Text>
            </View>
          </CollapsibleSection>

          {false && <CollapsibleSection
            title="Policies"
            isOpen={sections.policies}
            onToggle={() => toggleSection("policies")}
          >
            <View style={styles.policyRow}>
              <View style={styles.policyIcon}>
                <Ionicons name="calendar" size={20} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.policyTitle}>Free Cancellation</Text>
                <Text style={styles.policySub}>
                  Cancel before 24 hours for full refund
                </Text>
              </View>
            </View>
            <View style={[styles.policyRow, { marginTop: 12 }]}>
              <View style={styles.policyIcon}>
                <Ionicons name="time" size={20} color="#1e3a8a" />
              </View>
              <View>
                <Text style={styles.policyTitle}>Check-in/out</Text>
                <Text style={styles.policySub}>
                  Check-in: 3:00 PM • Check-out: 11:00 AM
                </Text>
              </View>
            </View>
          </CollapsibleSection>}

          {/* Urgency Alert */}
          <View style={styles.alertBox}>
            <Ionicons name="information-circle" size={20} color="#1e3a8a" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertText}>
                Only 2 rooms left at this price!
              </Text>
              <Text style={styles.alertSub}>Book now to secure your rate</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookNowBtn}
          onPress={() =>
            router.push({
              pathname: "/home/hotels/booking",
              params: { roomId: id },
            })
          }
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: theme.COLORS.white,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollBody: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageCounter: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  counterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  thumbnailRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  thumbnailWrap: {
    width: (width - 72) / 5,
    height: (width - 72) / 5,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeThumbnail: {
    borderColor: "#1e3a8a",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  statusBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: (width - 52) / 2,
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  section: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionContent: {
    paddingBottom: 16,
  },
  amenitiesList: {
    gap: 12,
  },
  amenityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amenityText: {
    fontSize: 15,
    color: "#475569",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: "#64748b",
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  policyRow: {
    flexDirection: "row",
    gap: 12,
  },
  policyIcon: {
    marginTop: 2,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  policySub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  alertText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  alertSub: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: theme.COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  bookNowBtn: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  bookNowText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default RoomDetailsScreen;


