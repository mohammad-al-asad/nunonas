import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";
import { useHomeFeedQuery } from "../../../lib/queries/homeQueries";

type OfferProvider = { id: string; name: string; service_type: "restaurant" | "hotel" | "spa"; image_url?: string };
type PlatformOffer = {
  id: string;
  name: string;
  purpose: string;
  discount_label: string;
  end_date: string;
  providers: OfferProvider[];
};

const ROUTES: Record<OfferProvider["service_type"], string> = {
  restaurant: "/home/dining",
  hotel: "/home/hotels",
  spa: "/home/spa",
};

function formatEnd(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "" : `Until ${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

/** Live platform campaigns and the providers that joined them. */
export default function PlatformOffers() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data } = useHomeFeedQuery();
  const offers = ((data as { platform_offers?: PlatformOffer[] } | undefined)?.platform_offers ?? []).filter(
    (offer) => offer.providers?.length,
  );
  if (!offers.length) return null;
  const cardWidth = offers.length > 1 ? Math.min(width - 64, 340) : width - 40;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Platform offers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {offers.map((offer) => (
          <View key={offer.id} style={[styles.card, { width: cardWidth }]}>
            <View style={styles.cardTop}>
              <Text style={styles.discount}>{offer.discount_label}</Text>
              <Text style={styles.until}>{formatEnd(offer.end_date)}</Text>
            </View>
            <Text style={styles.name}>{offer.name}</Text>
            {offer.purpose ? <Text style={styles.purpose} numberOfLines={2}>{offer.purpose}</Text> : null}
            <Text style={styles.providersLabel}>Available at</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providers}>
              {offer.providers.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.provider}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${provider.name}`}
                  onPress={() => router.push(`${ROUTES[provider.service_type]}/${provider.id}`)}
                >
                  {provider.image_url ? (
                    <Image source={{ uri: provider.image_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Ionicons name="storefront-outline" size={14} color={theme.COLORS.primary} />
                    </View>
                  )}
                  <Text style={styles.providerName} numberOfLines={1}>{provider.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: theme.COLORS.primary,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  discount: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.COLORS.white,
  },
  until: {
    fontSize: 12,
    fontWeight: "600",
    color: "#c7d2fe",
  },
  name: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.white,
  },
  purpose: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#e0e7ff",
  },
  providersLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#c7d2fe",
  },
  providers: {
    gap: 8,
  },
  provider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 170,
    borderRadius: 999,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    backgroundColor: theme.COLORS.white,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e7ff",
  },
  providerName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    color: theme.COLORS.textPrimary,
  },
});
