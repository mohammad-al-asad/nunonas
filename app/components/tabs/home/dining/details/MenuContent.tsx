import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../../../constants/theme";
import ImageViewer from "../../../../ui/ImageViewer";
import type { ProviderPayload } from "../../../../../lib/provider-types";

type MenuContentProps = {
  /** Menu items (dishes, drinks or spa treatments) added by the provider. */
  dishes?: ProviderPayload[];
  emptyTitle?: string;
  emptyText?: string;
};

function dishImage(dish: ProviderPayload): string | null {
  const images = (dish as { images?: unknown }).images;
  return Array.isArray(images) && typeof images[0] === "string" && images[0] ? images[0] : null;
}

function formatPrice(value: ProviderPayload["price"]) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "";
}

export default function MenuContent({
  dishes = [],
  emptyTitle = "Menu coming soon",
  emptyText = "This restaurant hasn't added its menu yet.",
}: MenuContentProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openImage = (uri: string) => {
    setSelectedImage(uri);
    setViewerVisible(true);
  };

  const sections = Array.from(new Set(dishes.map((dish) => dish.category || "Other")));

  if (!dishes.length) {
    return (
      <View style={[styles.container, styles.emptyState]}>
        <Ionicons name="restaurant-outline" size={32} color={theme.COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sections.map((section) => (
        <View key={section} style={styles.section}>
          <Text style={styles.sectionTitle}>{section}</Text>
          {dishes
            .filter((dish) => (dish.category || "Other") === section)
            .map((dish, index) => {
              const image = dishImage(dish);
              return (
                <View key={String(dish.id ?? dish._id ?? `${section}-${index}`)} style={styles.dishRow}>
                  {image ? (
                    <TouchableOpacity onPress={() => openImage(image)} accessibilityLabel={`View photo of ${dish.name}`}>
                      <Image source={{ uri: image }} style={styles.dishImage} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                      <Ionicons name="restaurant-outline" size={22} color={theme.COLORS.textSecondary} />
                    </View>
                  )}
                  <View style={styles.dishInfo}>
                    <View style={styles.dishHeader}>
                      <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                      <Text style={styles.dishPrice}>{formatPrice(dish.price)}</Text>
                    </View>
                    {dish.description ? (
                      <Text style={styles.dishDescription} numberOfLines={3}>{dish.description}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
        </View>
      ))}

      <ImageViewer
        isVisible={viewerVisible}
        imageSource={selectedImage}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.COLORS.white,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    marginBottom: 12,
  },
  dishRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  dishImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: theme.COLORS.surface,
  },
  dishImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  dishInfo: {
    flex: 1,
  },
  dishHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dishName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.COLORS.primary,
  },
  dishDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: theme.COLORS.textSecondary,
  },
});
