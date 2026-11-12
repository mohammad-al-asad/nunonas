// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";
import PageHeader from "../../../components/ui/PageHeader";
import { listNotifications, markAllNotificationsRead } from "../../../lib/customer-api";
import { parseServerDate } from "../../../lib/server-date";

const ICONS = {
  booking: "calendar",
  offer: "pricetag",
  review: "star",
  support: "chatbubbles",
};

function timeAgo(value) {
  const stamp = parseServerDate(value)?.getTime() ?? NaN;
  if (Number.isNaN(stamp)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - stamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(stamp).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const payload = await listNotifications();
      setItems(Array.isArray(payload?.items) ? payload.items : []);
      // Opening the list counts as reading it; the unread dot is shown on each row until the next visit.
      if (Number(payload?.unread_count ?? 0) > 0) {
        markAllNotificationsRead().catch(() => {});
      }
    } catch {
      setError("Notifications could not be loaded. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const renderItem = ({ item }) => {
    const unread = item.read !== true;
    return (
      <View style={[styles.row, unread && styles.rowUnread]}>
        <View style={styles.iconWrap}>
          <Ionicons name={ICONS[item.type] ?? "notifications"} size={20} color={theme.COLORS.primary} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{item.title || "Notification"}</Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
          {item.body || item.message ? <Text style={styles.message}>{item.body || item.message}</Text> : null}
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Notifications" onBack={() => router.back()} />
      {loading ? (
        <ActivityIndicator size="large" color={theme.COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item.id ?? item._id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={items.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={40} color={theme.COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>{error ? "Could not load notifications" : "No notifications yet"}</Text>
              <Text style={styles.emptyText}>{error || "Booking updates and offers will appear here."}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.white },
  loader: { marginTop: 60 },
  list: { padding: 20, gap: 12 },
  emptyList: { flexGrow: 1, justifyContent: "center", padding: 30 },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
  },
  rowUnread: { backgroundColor: "#f5f8ff", borderColor: "#dbe4ff" },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: theme.COLORS.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.COLORS.error },
  message: { marginTop: 4, fontSize: 14, lineHeight: 20, color: theme.COLORS.textSecondary },
  time: { marginTop: 6, fontSize: 12, color: theme.COLORS.textSecondary },
  empty: { alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: theme.COLORS.textPrimary },
  emptyText: { fontSize: 14, color: theme.COLORS.textSecondary, textAlign: "center" },
});
