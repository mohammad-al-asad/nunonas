import React from "react";
import { StyleSheet, Text, View } from "react-native";
import theme from "../../../../../constants/theme";
import type { ProviderPayload } from "../../../../../lib/provider-types";

export default function SpaServicesContent({ items = [] }: { items?: ProviderPayload[] }) {
  if (!items.length) {
    return <Text style={styles.empty}>No services available yet.</Text>;
  }
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={String(item.id ?? item._id ?? index)} style={styles.card}>
          <View style={styles.copy}>
            <Text style={styles.title}>{item.service_name ?? item.name ?? item.title ?? "Service"}</Text>
            <Text style={styles.description}>{item.description ?? item.service_type ?? "Professional service"}</Text>
          </View>
          {item.price != null ? <Text style={styles.price}>{String(item.price)}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, backgroundColor: theme.COLORS.white },
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, backgroundColor: theme.COLORS.surface, borderWidth: 1, borderColor: theme.COLORS.border },
  copy: { flex: 1, paddingRight: 12 },
  title: { color: theme.COLORS.textPrimary, fontSize: 16, fontWeight: "800" },
  description: { color: theme.COLORS.textSecondary, fontSize: 13, marginTop: 5 },
  price: { color: theme.COLORS.primary, fontSize: 15, fontWeight: "800" },
  empty: { padding: 24, color: theme.COLORS.textSecondary, textAlign: "center" },
});
