import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../constants/theme";

export type ProviderOffer = {
  id?: string;
  title?: string;
  promotion_name?: string;
  label?: string;
  description?: string;
  terms?: string;
  kind?: "booking" | "in_venue";
  source?: "platform" | "promotion";
  end_date?: string;
};

function formatEnd(value?: string) {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : `Until ${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

/** Offers on a provider's page: platform offers it joined first, then its own. */
export default function ProviderOffers({ offers, title = "Offers" }: { offers: ProviderOffer[]; title?: string }) {
  if (!offers.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {offers.map((offer, index) => {
        const platform = offer.source === "platform";
        const inVenue = offer.kind === "in_venue";
        const details = [offer.description, offer.terms].filter((text) => text && text.trim());
        return (
          <View key={offer.id ?? index} style={[styles.card, platform && styles.platformCard]}>
            <View style={[styles.icon, platform && styles.platformIcon]}>
              <MaterialCommunityIcons name={inVenue ? "silverware-fork-knife" : "percent"} size={22} color={platform ? theme.COLORS.white : "#1e3a8a"} />
            </View>
            <View style={styles.body}>
              <View style={styles.badges}>
                {platform ? <Text style={[styles.badge, styles.platformBadge]}>Platform offer</Text> : null}
                {inVenue ? <Text style={[styles.badge, styles.venueBadge]}>At the venue</Text> : null}
              </View>
              <Text style={styles.title}>{offer.title ?? offer.promotion_name ?? "Special offer"}</Text>
              {offer.label && offer.label !== offer.title ? <Text style={styles.label}>{offer.label}</Text> : null}
              {details.map((text, detailIndex) => (
                <Text key={detailIndex} style={styles.description}>{text}</Text>
              ))}
              <Text style={styles.footnote}>
                {[inVenue ? "Show this offer at the venue" : "Applied to your booking price", formatEnd(offer.end_date)].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
  },
  platformCard: {
    borderColor: "#c7d2fe",
    backgroundColor: "#f5f7ff",
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e7ff",
  },
  platformIcon: {
    backgroundColor: theme.COLORS.primary,
  },
  body: {
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  platformBadge: {
    color: theme.COLORS.white,
    backgroundColor: theme.COLORS.primary,
  },
  venueBadge: {
    color: "#a16207",
    backgroundColor: "#fef3c7",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  label: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: theme.COLORS.textSecondary,
  },
  footnote: {
    marginTop: 6,
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
});
