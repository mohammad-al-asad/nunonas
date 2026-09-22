// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../constants/theme";
import { listMyReviews } from "../../../lib/customer-api";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const ReviewCard = ({ review }) => {
  const rating = Number(review.rating ?? review.star_rating ?? 0);
  const providerName = review.provider_name || review.service || "Service provider";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {review.provider_image ? (
          <Image source={{ uri: review.provider_image }} style={styles.providerImage} />
        ) : (
          <View style={[styles.providerImage, styles.providerFallback]}>
            <Text style={styles.providerInitial}>{providerName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={17}
            color="#F59E0B"
          />
        ))}
      </View>
      <Text style={styles.reviewText}>{review.review_text || review.comment || ""}</Text>

      {review.vendor_reply ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel}>SERVICE PROVIDER RESPONSE</Text>
          <Text style={styles.replyText}>{review.vendor_reply}</Text>
        </View>
      ) : (
        <Text style={styles.awaitingReply}>Awaiting service provider response</Text>
      )}
    </View>
  );
};

export default function MyReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      setError("");
      const payload = await listMyReviews({ limit: 100 });
      setReviews(payload?.items ?? []);
    } catch (requestError) {
      setError(requestError?.message || "Your reviews could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>My Reviews</Text>
          <Text style={styles.subtitle}>Your feedback and provider responses</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadReviews();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="star-outline" size={44} color="#CBD5E1" />
              <Text style={[styles.emptyTitle, error && styles.error]}>
                {error || "No reviews yet"}
              </Text>
              <Text style={styles.emptyText}>
                {error
                  ? "Pull down to try again."
                  : "Completed-booking reviews will appear here."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  title: { color: theme.COLORS.textPrimary, fontSize: 21, fontWeight: "800" },
  subtitle: { color: theme.COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  list: { padding: 16, flexGrow: 1 },
  center: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  providerImage: { width: 48, height: 48, borderRadius: 15 },
  providerFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2FE",
  },
  providerInitial: { color: "#0369A1", fontSize: 18, fontWeight: "800" },
  providerInfo: { flex: 1, marginLeft: 12 },
  providerName: { color: theme.COLORS.textPrimary, fontSize: 16, fontWeight: "800" },
  reviewDate: { color: theme.COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ratingValue: { color: "#92400E", fontSize: 13, fontWeight: "800" },
  stars: { flexDirection: "row", gap: 3, marginTop: 16 },
  reviewText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  reply: { borderRadius: 15, backgroundColor: "#F1F5F9", padding: 14, marginTop: 16 },
  replyLabel: { color: "#0284C7", fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  replyText: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  awaitingReply: { color: "#94A3B8", fontSize: 11, fontWeight: "600", marginTop: 16 },
  emptyTitle: {
    color: theme.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  error: { color: "#DC2626" },
});
