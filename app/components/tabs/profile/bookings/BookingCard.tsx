// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../constants/theme";

const BookingCard = ({ item, onViewDetails }) => {
  const status = String(item.status || "pending").toLowerCase();
  const statusStyle = status === "canceled" || status === "cancelled"
    ? styles.statusCanceled
    : status === "pending"
      ? styles.statusPending
      : status === "complete" || status === "completed"
        ? styles.statusComplete
        : styles.statusConfirmed;

  return (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <View style={styles.imageWrapper}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : <View style={[styles.cardImage, styles.imagePlaceholder]}><Ionicons name="calendar-outline" size={30} color={theme.COLORS.primary} /></View>}
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.cardCategory}>{item.category}</Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.COLORS.textSecondary}
          />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.COLORS.textSecondary}
          />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

        <TouchableOpacity style={styles.viewDetailsBtn} onPress={onViewDetails}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  imageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  imagePlaceholder: {
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: "#d97706",
  },
  statusConfirmed: {
    backgroundColor: theme.COLORS.primary,
  },
  statusComplete: {
    backgroundColor: theme.COLORS.success,
  },
  statusCanceled: {
    backgroundColor: theme.COLORS.error,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.COLORS.white,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.COLORS.primary,
    marginTop: 2,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  viewDetailsBtn: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
});

export default BookingCard;


