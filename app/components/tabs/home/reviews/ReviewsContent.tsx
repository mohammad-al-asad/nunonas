import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";
import {
  getHotelReviews,
  getRestaurantReviews,
  getSpaReviews,
} from "../../../../lib/customer-api";

type RatingBarProps = {
  label: string;
  percentage: number;
  count: number;
};

type Review = {
  id: string;
  user: string;
  date: string;
  rating: number;
  comment: string;
  avatar?: string;
  vendor_reply?: string | null;
};

type ReviewsContentProps = {
  restaurantId?: string;
  providerType?: "restaurant" | "spa" | "hotel";
};

type ReviewSummary = {
  average: number;
  total: number;
  breakdown: Record<string, number>;
};

const RatingBar = ({ label, percentage, count }: RatingBarProps) => (
  <View style={styles.ratingBarRow}>
    <Text style={styles.ratingBarLabel}>{label}★</Text>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${percentage}%` }]} />
    </View>
    <Text style={styles.ratingBarCount}>{count}</Text>
  </View>
);

const ReviewCard = ({ review }: { review: Review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      {review.avatar ? (
        <Image source={{ uri: review.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{(review.user || "C").charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{review.user}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= review.rating ? "star" : "star-outline"}
              size={14}
              color="#FACC15"
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewDate}>{review.date}</Text>
    </View>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    {review.vendor_reply ? (
      <View style={styles.providerReply}>
        <Text style={styles.providerReplyLabel}>SERVICE PROVIDER RESPONSE</Text>
        <Text style={styles.providerReplyText}>{review.vendor_reply}</Text>
      </View>
    ) : null}
  </View>
);

export default function ReviewsContent({
  restaurantId,
  providerType = "restaurant",
}: ReviewsContentProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    average: 0,
    total: 0,
    breakdown: {},
  });
  const [loading, setLoading] = useState(Boolean(restaurantId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setError("This service provider could not be identified.");
      return;
    }

    setLoading(true);
    setError("");
    const request =
      providerType === "hotel"
        ? getHotelReviews
        : providerType === "spa"
          ? getSpaReviews
          : getRestaurantReviews;
    request(restaurantId)
      .then((payload: any) => {
        setReviews(payload?.items ?? []);
        setSummary({
          average: Number(payload?.average_rating ?? 0),
          total: Number(payload?.total_reviews ?? 0),
          breakdown: payload?.breakdown ?? {},
        });
      })
      .catch((requestError: any) => {
        setReviews([]);
        setSummary({ average: 0, total: 0, breakdown: {} });
        setError(requestError?.message || "Reviews could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [providerType, restaurantId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.overallRating}>{summary.average.toFixed(1)}</Text>
        <View style={styles.starsRowMain}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(summary.average) ? "star" : "star-outline"}
              size={24}
              color="#FACC15"
            />
          ))}
        </View>
        <Text style={styles.reviewsCount}>Based on {summary.total} reviews</Text>

        <View style={styles.barsContainer}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = Number(summary.breakdown[String(rating)] ?? 0);
            const percentage = summary.total ? Math.round((count / summary.total) * 100) : 0;
            return (
              <RatingBar
                key={rating}
                label={String(rating)}
                percentage={percentage}
                count={count}
              />
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Reviews</Text>
      {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews available yet.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F8FAFC" },
  loadingContainer: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: theme.COLORS.textSecondary,
    paddingVertical: 24,
  },
  errorText: {
    textAlign: "center",
    color: "#DC2626",
    paddingVertical: 24,
  },
  summaryCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    ...theme.SHADOWS.card,
  },
  overallRating: {
    fontSize: 48,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  starsRowMain: { flexDirection: "row", gap: 4, marginBottom: 8 },
  reviewsCount: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginBottom: 20,
  },
  barsContainer: { width: "100%", gap: 10 },
  ratingBarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ratingBarLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    width: 25,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: "#FACC15", borderRadius: 4 },
  ratingBarCount: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    width: 30,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...theme.SHADOWS.card,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#0369A1", fontSize: 17, fontWeight: "800" },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 2,
  },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewDate: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  reviewComment: { fontSize: 14, color: theme.COLORS.textSecondary, lineHeight: 20 },
  providerReply: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    padding: 14,
  },
  providerReplyLabel: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  providerReplyText: {
    color: theme.COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
