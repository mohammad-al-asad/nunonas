import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import theme from "../../constants/theme";
import type { BookingQuote } from "../../lib/customer-api";

type BookingPriceSummaryProps = {
  quote: BookingQuote | null;
  loading?: boolean;
};

const money = (value: number | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));

export default function BookingPriceSummary({ quote, loading = false }: BookingPriceSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price summary</Text>
      {loading ? (
        <ActivityIndicator color={theme.COLORS.primary} style={styles.loader} />
      ) : quote ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Original amount</Text>
            <Text style={styles.value}>{money(quote.original_subtotal)}</Text>
          </View>
          {Number(quote.room_discount_amount ?? 0) > 0 ? (
            <View style={styles.row}>
              <Text style={styles.discountLabel}>Room discount</Text>
              <Text style={styles.discountValue}>-{money(quote.room_discount_amount)}</Text>
            </View>
          ) : null}
          {Number(quote.discount_amount ?? 0) > 0 ? (
            <View style={styles.row}>
              <Text style={styles.discountLabel}>{quote.promotion_name || "Promotion"}</Text>
              <Text style={styles.discountValue}>-{money(quote.discount_amount)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Service fee</Text>
            <Text style={styles.value}>{money(quote.service_fee)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{quote.tax_included ? "Taxes (included)" : "Taxes"}</Text>
            <Text style={styles.value}>{money(quote.taxes)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(quote.total)}</Text>
          </View>
          {Number(quote.estimated_points ?? 0) > 0 ? (
            <Text style={styles.points}>Earn approximately {Number(quote.estimated_points).toLocaleString()} points after completion</Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.empty}>Price is unavailable. Review the booking details and try again.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 16,
    backgroundColor: theme.COLORS.white,
    padding: 18,
  },
  title: {
    color: theme.COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  loader: {
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
    gap: 16,
  },
  label: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
  },
  value: {
    color: theme.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  discountLabel: {
    color: "#15803d",
    fontSize: 14,
  },
  discountValue: {
    color: "#15803d",
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: theme.COLORS.border,
    marginVertical: 5,
  },
  totalLabel: {
    color: theme.COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  totalValue: {
    color: theme.COLORS.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  points: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: "#fffbeb",
    color: "#a16207",
    fontSize: 12,
    fontWeight: "600",
    padding: 10,
  },
  empty: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
  },
});
