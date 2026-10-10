// @ts-nocheck
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import { useGridColumns } from "../../../../../lib/use-grid-columns";
import { forwardGeocode } from "../../../../../lib/google-maps";
import HotelOverviewMap from "./HotelOverviewMap";
import ProviderOffers from "../../../../ui/ProviderOffers";

const amenityIcon = (name) => {
  const value = String(name).toLowerCase();
  if (value.includes("wifi")) return ["wifi", "Ionicons"];
  if (value.includes("breakfast") || value.includes("food")) return ["restaurant-outline", "Ionicons"];
  if (value.includes("pool")) return ["pool", "MaterialCommunityIcons"];
  if (value.includes("gym") || value.includes("fitness")) return ["weight-lifter", "MaterialCommunityIcons"];
  if (value.includes("parking")) return ["parking", "MaterialCommunityIcons"];
  if (value.includes("shuttle") || value.includes("airport")) return ["airplane-outline", "Ionicons"];
  if (value.includes("air condition") || /\bac\b/.test(value)) return ["snow-outline", "Ionicons"];
  if (value.includes("garden")) return ["flower-outline", "Ionicons"];
  if (value.includes("restaurant")) return ["restaurant-outline", "Ionicons"];
  if (value.includes("spa") || value.includes("sauna")) return ["spa-outline", "MaterialCommunityIcons"];
  if (value.includes("tv")) return ["tv-outline", "Ionicons"];
  return ["checkmark-circle-outline", "Ionicons"];
};

const HotelOverviewContent = ({ hotel }) => {
  const grid = useGridColumns();
  const address = hotel?.address || hotel?.location || hotel?.locationText || "";
  const [mapCenter, setMapCenter] = React.useState(
    hotel?.latitude != null && hotel?.longitude != null
      ? { latitude: Number(hotel.latitude), longitude: Number(hotel.longitude) }
      : null,
  );

  React.useEffect(() => {
    let active = true;
    if (hotel?.latitude != null && hotel?.longitude != null) {
      setMapCenter({ latitude: Number(hotel.latitude), longitude: Number(hotel.longitude) });
      return () => { active = false; };
    }
    if (address) {
      forwardGeocode(address).then((coordinates) => {
        if (active) setMapCenter(coordinates);
      });
    }
    return () => { active = false; };
  }, [address, hotel?.latitude, hotel?.longitude]);


  return (
    <View style={styles.container}>
      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          {hotel?.about || hotel?.description || "No description provided by this property."}
        </Text>
      </View>

      {/* Amenities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {(hotel?.amenities ?? []).length ? hotel.amenities.map((name, index) => {
            const [icon, library] = amenityIcon(name);
            return <View key={`${name}-${index}`} style={[styles.amenityBox, { width: grid.itemWidth }]}>
              <View style={styles.iconCircle}>
                {library === "Ionicons" ? (
                  <Ionicons
                    name={icon}
                    size={24}
                    color={theme.COLORS.primary}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={theme.COLORS.primary}
                  />
                )}
              </View>
              <Text style={styles.amenityName} numberOfLines={2}>{name}</Text>
            </View>;
          }) : <Text style={styles.emptyText}>No amenities provided.</Text>}
          {/* Invisible fillers keep a short last row aligned to the columns. */}
          {Array.from({ length: grid.fillerCount((hotel?.amenities ?? []).length) }, (_, index) => (
            <View key={`filler-${index}`} style={[styles.amenityBox, { width: grid.itemWidth }]} />
          ))}
        </View>
      </View>

      <ProviderOffers offers={hotel?.offers ?? []} title="Special Offers" />

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <HotelOverviewMap center={mapCenter} />
        <Text style={styles.address}>{address || "Location not provided."}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.COLORS.white,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.COLORS.primary,
    marginTop: 4,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  amenityBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  amenityName: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  address: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
});

export default HotelOverviewContent;

