// @ts-nocheck
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import { getHotelReviews } from "../../../../../lib/customer-api";

const HotelReviewsContent = ({ hotelId }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const data = await getHotelReviews(hotelId);
        setReviewsData(data);
      } catch (err) {
        console.error("Failed to fetch hotel reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    if (hotelId) fetchReviews();
  }, [hotelId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40 }]}>
        <ActivityIndicator size="small" color="#1e3a8a" />
      </View>
    );
  }

  const averageRating = reviewsData?.average_rating ?? 0;
  const totalReviews = reviewsData?.total_reviews || 0;
  const reviewsList = reviewsData?.items || [];

  if (reviewsList.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40 }]}>
        <Text style={{ fontWeight: "700", color: "#64748b" }}>No reviews yet for this hotel.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryBox}>
        <Text style={styles.bigRating}>{averageRating}</Text>
        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            const avgNum = parseFloat(averageRating);
            if (avgNum >= starValue) {
              return <Ionicons key={i} name="star" size={20} color="#facc15" />;
            } else if (avgNum >= starValue - 0.5) {
              return <Ionicons key={i} name="star-half" size={20} color="#facc15" />;
            } else {
              return <Ionicons key={i} name="star-outline" size={20} color="#94a3b8" />;
            }
          })}
        </View>
        <Text style={styles.totalReviews}>Based on {totalReviews} reviews</Text>
      </View>

      <View style={styles.list}>
        {reviewsList.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(review.user || "A")[0]}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{review.user}</Text>
                <Text style={styles.date}>{review.date}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="white" />
                <Text style={styles.ratingText}>{review.rating}</Text>
              </View>
            </View>
            <Text style={styles.comment}>{review.comment}</Text>
            {review.vendor_reply ? (
              <View style={styles.providerReply}>
                <Text style={styles.providerReplyLabel}>SERVICE PROVIDER RESPONSE</Text>
                <Text style={styles.providerReplyText}>{review.vendor_reply}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.COLORS.white,
  },
  summaryBox: {
    alignItems: "center",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
  },
  bigRating: {
    fontSize: 48,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  stars: {
    flexDirection: "row",
    marginVertical: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  list: {
    gap: 20,
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 20,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  date: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
  },
  ratingBadge: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  comment: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    lineHeight: 20,
  },
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
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
});

export default HotelReviewsContent;


