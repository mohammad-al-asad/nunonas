import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import { useGridColumns } from "../../../../../lib/use-grid-columns";
import type { NormalizedRestaurant } from "../../../../../lib/provider-types";

const AMENITY_COLOR = "#3b82f6";

// Icon picked by keyword in the amenity name; anything unknown gets a generic check.
const AMENITY_ICONS = [
  ["wifi", "wifi"],
  ["parking", "car"],
  ["outdoor", "leaf"],
  ["rooftop", "partly-sunny"],
  ["card", "card"],
  ["access", "accessibility"],
  ["wheelchair", "accessibility"],
  ["bar", "wine"],
  ["air", "snow"],
  ["family", "people"],
  ["kid", "happy"],
  ["view", "eye"],
  ["music", "musical-notes"],
  ["delivery", "bicycle"],
];

function amenityIcon(name: string) {
  const lower = String(name).toLowerCase();
  return AMENITY_ICONS.find(([keyword]) => lower.includes(keyword))?.[1] ?? "checkmark-circle";
}

type OverviewContentProps = {
  restaurant: NormalizedRestaurant;
};

export default function OverviewContent({ restaurant }: OverviewContentProps) {
  const grid = useGridColumns();
  return (
    <View style={styles.container}>
      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          {restaurant.description || "No description available."}
        </Text>
      </View>

      {/* Opening Hours Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opening Hours</Text>
        <View style={styles.hoursRow}>
          <Text style={styles.dayText}>Monday - Friday</Text>
          <Text style={styles.timeText}>{restaurant.openingHours?.open_time && restaurant.openingHours?.close_time ? `${restaurant.openingHours.open_time} - ${restaurant.openingHours.close_time}` : "Not provided"}</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.dayText}>Saturday - Sunday</Text>
          <Text style={styles.timeText}>{restaurant.openingHours?.open_time && restaurant.openingHours?.close_time ? `${restaurant.openingHours.open_time} - ${restaurant.openingHours.close_time}` : "Not provided"}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{restaurant.openingHours?.is_open_now === false ? "Closed" : "Open Now"}</Text>
        </View>
      </View>

      {/* Amenities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenityGrid}>
          {restaurant.amenities.map((name, index) => (
            <View key={`${name}-${index}`} style={[styles.amenityItem, { width: grid.itemWidth }]}>
              <View style={styles.amenityIconBox}>
                <Ionicons name={amenityIcon(name)} size={24} color={AMENITY_COLOR} />
              </View>
              <Text style={styles.amenityName} numberOfLines={2}>{name}</Text>
            </View>
          ))}
          {/* Invisible fillers keep a short last row aligned to the columns. */}
          {Array.from({ length: grid.fillerCount(restaurant.amenities.length) }, (_, index) => (
            <View key={`filler-${index}`} style={[styles.amenityItem, { width: grid.itemWidth }, styles.amenityFiller]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    lineHeight: 24,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  amenityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  amenityItem: {
    backgroundColor: theme.COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  amenityFiller: {
    backgroundColor: "transparent",
  },
  amenityIconBox: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  amenityName: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
});


