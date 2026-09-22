// @ts-nocheck
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import ReviewModal from "../../../../components/ui/ReviewModal";
import { cancelBooking, createBookingReview, getBooking } from "../../../../lib/customer-api";
import { showToast } from "../../../../lib/toast";

const InfoRow = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

const DetailCard = ({ title, children, containerStyle }) => (
  <View style={[styles.detailCard, containerStyle]}>
    <Text style={styles.detailCardTitle}>{title}</Text>
    {children}
  </View>
);

const ActionButton = ({ icon, label, onPress, variant = "secondary" }) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      variant === "danger" && styles.actionButtonDanger,
      variant === "primary" && styles.actionButtonPrimary,
    ]}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={20}
      color={
        variant === "secondary" ? theme.COLORS.textPrimary : theme.COLORS.white
      }
    />
    <Text
      style={[
        styles.actionButtonText,
        variant === "secondary"
          ? styles.actionButtonTextSecondary
          : styles.actionButtonTextPrimary,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function BookingDetailsScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const [liveBooking, setLiveBooking] = React.useState(null);
  React.useEffect(() => {
    const bookingId = routeParams.id;
    if (!bookingId) return;
    let active = true;
    getBooking(String(bookingId)).then((booking) => {
      if (active) setLiveBooking(booking);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [routeParams.id]);
  const params = {
    ...routeParams,
    ...(liveBooking || {}),
    title: liveBooking?.provider_name || liveBooking?.service || routeParams.title,
    category: liveBooking
      ? liveBooking.provider_type === "hotel" || liveBooking.provider_type === "hotel_room"
        ? "Hotel"
        : liveBooking.provider_type === "spa"
          ? "Spa"
          : liveBooking.provider_type === "event"
            ? "Event"
            : "Restaurant"
      : routeParams.category,
    location: liveBooking?.provider_area || liveBooking?.provider_address || routeParams.location || "Location unavailable",
    phone: liveBooking?.provider_phone || routeParams.phone,
    bookingId: liveBooking?.booking_code || routeParams.bookingId,
    date: liveBooking?.scheduled_date || liveBooking?.date || routeParams.date,
    time: liveBooking?.scheduled_time || liveBooking?.time,
    guests: liveBooking?.guests || routeParams.guests,
    notes: liveBooking?.special_requests || liveBooking?.special_notes || liveBooking?.notes,
    payment_status: liveBooking?.payment_status || routeParams.payment_status,
    seating_preference: liveBooking?.seating_preference || routeParams.seating_preference,
    total_amount: liveBooking?.total_amount ?? routeParams.total_amount,
    checkIn: liveBooking?.check_in_date || routeParams.checkIn,
    checkOut: liveBooking?.check_out_date || routeParams.checkOut,
    nights: liveBooking?.nights || routeParams.nights,
    roomType: liveBooking?.room_type || liveBooking?.service || routeParams.roomType,
    pricePerNight: liveBooking?.rate_per_night,
    originalSubtotal: liveBooking?.original_subtotal,
    serviceFee: liveBooking?.service_fee,
    taxes: liveBooking?.taxes,
    discountAmount: liveBooking?.discount_amount,
    promotionName: liveBooking?.promotion_name,
    estimatedPoints: liveBooking?.estimated_points,
    pointsAwarded: liveBooking?.points_awarded,
    statusHistory: liveBooking?.status_history || [],
    review: liveBooking?.review,
    imageUrl: liveBooking?.provider_image || routeParams.imageUrl,
  };
  const isHotel = params.category === "Hotel";
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const normalizedStatus = String(params.status || "").toLowerCase();
  const canCancel = ["pending", "confirmed", "check_in", "check in"].includes(normalizedStatus);
  const canReview = ["complete", "completed"].includes(normalizedStatus) && !params.review;

  const handleCall = () => {
    const phoneNumber = params.phone;
    if (!phoneNumber) {
      Alert.alert("Phone unavailable", "This service provider has not added a contact number.");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleCancel = () => {
    Alert.alert("Cancel booking?", "This action will cancel your booking.", [
      { text: "Keep Booking", style: "cancel" },
      {
        text: "Cancel Booking",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await cancelBooking(String(routeParams.id), "Cancelled by customer");
            setLiveBooking(updated);
            showToast("Booking cancelled.", { type: "success" });
          } catch (error) {
            showToast(error?.message || "Could not cancel this booking.", { type: "error" });
          }
        },
      },
    ]);
  };

  const handleReviewSubmit = async ({ rating, review }) => {
    try {
      const createdReview = await createBookingReview(String(routeParams.id), {
        rating,
        review_text: review,
      });
      setLiveBooking((current) => ({
        ...(current || {}),
        review: createdReview,
        has_review: true,
      }));
      showToast("Review submitted successfully.", { type: "success" });
    } catch (error) {
      showToast(error?.message || "Could not submit your review.", { type: "error" });
      throw error;
    }
  };

  const renderTimeline = () => (
    <DetailCard title="Booking Timeline">
      {(params.statusHistory || []).map((entry, index) => (
        <View key={`${entry.status}-${entry.at}-${index}`} style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>{entry.label || String(entry.status || "Updated").replace(/_/g, " ")}</Text>
            <Text style={styles.timelineDate}>{entry.at ? new Date(entry.at).toLocaleString() : "Time unavailable"}</Text>
            {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
          </View>
        </View>
      ))}
      {!params.statusHistory?.length ? <Text style={styles.notesValue}>No status updates available.</Text> : null}
      {Number(params.pointsAwarded || params.estimatedPoints || 0) > 0 ? (
        <Text style={styles.pointsNote}>
          {Number(params.pointsAwarded || 0) > 0 ? `${params.pointsAwarded} points awarded` : `Approximately ${params.estimatedPoints} points after completion`}
        </Text>
      ) : null}
    </DetailCard>
  );

  const renderHotelLayout = () => (
    <>
      <View style={styles.imageContainer}>
        <Image
          source={params.imageUrl ? { uri: params.imageUrl } : require("../../../../assets/images/discover-experience.png")}
          style={styles.headerImage}
        />
        <TouchableOpacity
          style={styles.backButtonOverlay}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.statusBadgeOverlay}>
          <Text style={styles.statusBadgeText}>{params.status}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{params.title}</Text>
          {params.rating ? <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4].map((i) => (
                <Ionicons key={i} name="star" size={16} color="#FFD700" />
              ))}
              <Ionicons name="star-outline" size={16} color="#FFD700" />
            </View>
            <Text style={styles.ratingText}>{params.rating}</Text>
          </View> : null}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={theme.COLORS.primary} />
            <Text style={styles.locationText}>{params.location}</Text>
          </View>
        </View>

        <DetailCard
          title="Stay Information"
          containerStyle={styles.stayInfoCard}
        >
          <InfoRow label="Check-in" value={params.checkIn || "Not available"} />
          <InfoRow
            label="Check-out"
            value={params.checkOut || "Not available"}
          />
          <InfoRow
            label="Number of Nights"
            value={params.nights ? `${params.nights} nights` : "Not available"}
          />
          <InfoRow
            label="Room Type"
            value={params.roomType || "Hotel Room"}
          />
          <InfoRow label="Guests" value={params.guests || "1"} />
        </DetailCard>

        <DetailCard title="Payment Summary">
          <InfoRow
            label="Room Price (per night)"
            value={params.pricePerNight != null ? `$${Number(params.pricePerNight).toFixed(2)}` : "Not available"}
          />
          <InfoRow
            label="Original amount"
            value={params.originalSubtotal != null ? `$${Number(params.originalSubtotal).toFixed(2)}` : "Not available"}
          />
          {Number(params.discountAmount || 0) > 0 ? <InfoRow label={params.promotionName || "Promotion"} value={`-$${Number(params.discountAmount).toFixed(2)}`} /> : null}
          <InfoRow label="Service fee" value={`$${Number(params.serviceFee || 0).toFixed(2)}`} />
          <InfoRow label="Taxes" value={`$${Number(params.taxes || 0).toFixed(2)}`} />
          <View style={styles.divider} />
          <InfoRow
            label="Total amount"
            value={params.total_amount != null ? `$${Number(params.total_amount).toFixed(2)}` : "Not available"}
            valueStyle={styles.totalPaidValue}
          />
        </DetailCard>
        {renderTimeline()}
      </View>
    </>
  );

  const renderRestaurantLayout = () => (
    <View style={styles.restaurantContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.restaurantCard}>
          <Text style={styles.entityTitle}>{params.title}</Text>
          <Text style={styles.entityCategory}>
            {params.category || "Service"}
          </Text>

          <View style={styles.entityInfoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={theme.COLORS.textSecondary}
            />
            <Text style={styles.entityInfoText}>{params.location}</Text>
          </View>

          <View style={styles.entityInfoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color={theme.COLORS.textSecondary}
            />
            <Text
              style={[styles.entityInfoText, { color: theme.COLORS.primary }]}
            >
              {params.phone || "Phone unavailable"}
            </Text>
          </View>
        </View>

        <DetailCard title="Booking Information">
          <InfoRow
            label="Booking ID"
            value={params.bookingId || "Pending"}
          />
          <View style={styles.cardDivider} />
          <InfoRow label="Date" value={params.date} />
          <View style={styles.cardDivider} />
          <InfoRow label="Time" value={params.time || "Not available"} />
          <View style={styles.cardDivider} />
          <InfoRow label="Guests" value={params.guests || "1"} />
          <View style={styles.cardDivider} />
          <InfoRow label="Status" value={params.status || "Pending"} />
          <View style={styles.cardDivider} />
          <InfoRow label="Payment" value={params.payment_status || "Unpaid"} />
          <View style={styles.cardDivider} />
          <InfoRow label="Seating" value={params.seating_preference || "No preference"} />
          <View style={styles.cardDivider} />
          {Number(params.discountAmount || 0) > 0 ? (
            <>
              <InfoRow label={params.promotionName || "Promotion"} value={`-$${Number(params.discountAmount).toFixed(2)}`} />
              <View style={styles.cardDivider} />
            </>
          ) : null}
          <InfoRow label="Total" value={params.total_amount != null ? `$${Number(params.total_amount).toFixed(2)}` : "—"} />
          <View style={styles.cardDivider} />
          <View style={styles.notesRow}>
            <Text style={styles.infoLabel}>Special Notes</Text>
            <Text style={styles.notesValue}>
              {params.notes || "No special requests"}
            </Text>
          </View>
        </DetailCard>
        {renderTimeline()}

        <View style={styles.actionsContainer}>
          <ActionButton
            icon="call"
            label="Contact Entity"
            variant="primary"
            onPress={handleCall}
          />
          {canCancel ? <ActionButton icon="close" label="Cancel Booking" variant="danger" onPress={handleCancel} /> : null}
          <ActionButton
            icon="headset"
            label="Contact Support"
            onPress={() => router.push("/profile/support")}
          />
          {canReview ? <ActionButton
            icon="star"
            label="Leave Review"
            onPress={() => setShowReviewModal(true)}
          /> : null}
        </View>
        {params.review ? (
          <DetailCard title="Your Review">
            <InfoRow label="Rating" value={`${params.review.rating || params.review.star_rating}/5`} />
            <View style={styles.cardDivider} />
            <Text style={styles.notesValue}>{params.review.review_text || params.review.comment}</Text>
          </DetailCard>
        ) : null}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.mainContainer} edges={isHotel ? [] : ["top"]}>
      <StatusBar barStyle="dark-content" />
      {isHotel ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHotelLayout()}
          <View
            style={[
              styles.actionsContainer,
              { paddingHorizontal: 20, paddingBottom: 40 },
            ]}
          >
            <ActionButton
              icon="call"
              label="Contact Hotel"
              variant="primary"
              onPress={handleCall}
            />
            {canCancel ? <ActionButton
              icon="close"
              label="Cancel Booking"
              variant="danger"
              onPress={handleCancel}
            /> : null}
            <ActionButton
              icon="headset"
              label="Contact Support"
              onPress={() => router.push("/profile/support")}
            />
            {canReview ? <ActionButton
              icon="star"
              label="Leave Review"
              onPress={() => setShowReviewModal(true)}
            /> : null}
          </View>
          {params.review ? (
            <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
              <DetailCard title="Your Review">
                <InfoRow label="Rating" value={`${params.review.rating || params.review.star_rating}/5`} />
                <View style={styles.cardDivider} />
                <Text style={styles.notesValue}>{params.review.review_text || params.review.comment}</Text>
              </DetailCard>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        renderRestaurantLayout()
      )}

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  restaurantContainer: {
    flex: 1,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.COLORS.primary,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: theme.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  timelineDate: {
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  timelineNote: {
    color: theme.COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  pointsNote: {
    color: "#a16207",
    backgroundColor: "#fffbeb",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Hotel Layout Styles
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  backButtonOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeOverlay: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(30, 58, 138, 0.9)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: theme.COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  contentContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
    marginRight: 10,
  },
  ratingText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  // Common Detail Card
  detailCard: {
    backgroundColor: "#EFF6FF", // Light blue from mockup
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  stayInfoCard: {
    backgroundColor: "#EFF6FF",
  },
  detailCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: theme.COLORS.border,
    marginVertical: 15,
  },
  totalPaidValue: {
    fontSize: 18,
    color: theme.COLORS.primary,
    fontWeight: "800",
  },
  // Restaurant Layout Styles
  restaurantCard: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    ...theme.SHADOWS.card,
  },
  entityTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 4,
  },
  entityCategory: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    marginBottom: 15,
  },
  entityInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  entityInfoText: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 12,
  },
  notesRow: {
    marginTop: 5,
  },
  notesValue: {
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 22,
    textAlign: "right",
    flex: 1,
  },
  // Actions
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F1F5F9",
  },
  actionButtonPrimary: {
    backgroundColor: theme.COLORS.primary,
  },
  actionButtonDanger: {
    backgroundColor: theme.COLORS.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionButtonTextPrimary: {
    color: theme.COLORS.white,
  },
  actionButtonTextSecondary: {
    color: theme.COLORS.textPrimary,
  },
});


