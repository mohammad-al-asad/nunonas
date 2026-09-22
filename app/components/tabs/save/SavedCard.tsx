// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

const SavedCard = ({ item, onDetails, onAction, onRemove }) => {
  const isHotel = String(item.type).toLowerCase() === "hotel";
  const imageSource = typeof item.image === "string" ? { uri: item.image } : item.image;

  return (
    <View style={styles.container}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageSource ? <Image source={imageSource} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.imagePlaceholder]}><Ionicons name="image-outline" size={36} color={theme.COLORS.textSecondary} /></View>}
        <TouchableOpacity style={styles.heartBtn} activeOpacity={0.8} onPress={onRemove}>
          <Ionicons name="heart" size={24} color={theme.COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Ionicons
              name={item.categoryIcon}
              size={14}
              color={theme.COLORS.primary}
            />
            <Text style={styles.categoryText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          {item.rating && (
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <View style={styles.dot} />
            </View>
          )}
          <Text style={styles.subInfo}>{item.subInfo}</Text>
        </View>

        {item.savedAt && (
          <Text style={styles.savedAtText}>
            Saved {new Date(item.savedAt).toLocaleDateString()}
          </Text>
        )}

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.COLORS.textSecondary}
          />
          <Text style={styles.locationText}>
            {item.location}, {item.distance}
          </Text>
        </View>

        {isHotel && item.price && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.priceUnit}>/night</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={onDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {item.actionLabel || "Book Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    overflow: "hidden",
    ...theme.SHADOWS.card,
  },
  imageContainer: {
    height: 180,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.COLORS.surface,
  },
  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...theme.SHADOWS.card,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginLeft: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.COLORS.textSecondary,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  subInfo: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  savedAtText: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    marginLeft: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: theme.COLORS.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsBtnText: {
    color: theme.COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: {
    color: theme.COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});

export default SavedCard;


