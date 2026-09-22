// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../../constants/theme";
import SaveButton from "../../../../ui/SaveButton";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = width * 0.95;
const FALLBACK_IMAGE = require("../../../../../assets/images/discover-experience.png");

const ImageHeader = ({ image, images = [], entityId }) => {
  const router = useRouter();

  const validSlides = useMemo(() => {
    const rawList = images.length ? images : [image];
    const filtered = rawList
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string" && item.trim()) return { uri: item.trim() };
        if (typeof item === "object" && item.uri && typeof item.uri === "string" && item.uri.trim()) {
          return { uri: item.uri.trim() };
        }
        if (typeof item === "number") return item;
        return null;
      })
      .filter(Boolean);

    return filtered.length ? filtered : [FALLBACK_IMAGE];
  }, [image, images]);

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.container}>
      <FlatList
        data={validSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `header-image-${index}`}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveIndex(Math.max(0, Math.min(index, validSlides.length - 1)));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item} style={styles.image} defaultSource={FALLBACK_IMAGE} />
          </View>
        )}
      />

      {/* Top Overlay Buttons */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>

        <SaveButton entityType="restaurant" entityId={entityId} compact />
      </View>

      {validSlides.length > 1 ? (
        <View style={styles.pagination}>
          {validSlides.map((_, index) => (
            <View
              key={`header-dot-${index}`}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    width: width,
    position: "relative",
    backgroundColor: theme.COLORS.surface,
  },
  slide: {
    width: width,
    height: HEADER_HEIGHT,
  },
  image: {
    width: width,
    height: HEADER_HEIGHT,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    top: 50, // Account for status bar
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: theme.COLORS.white,
    width: 24,
  },
});

export default ImageHeader;


