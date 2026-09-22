// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../../../constants/theme";
import type { ProviderImageSource } from "../../../../../lib/provider-types";
import SaveButton from "../../../../ui/SaveButton";

const { width } = Dimensions.get("window");
const ASPECT_RATIO = 1.3;
const HEADER_HEIGHT = width / ASPECT_RATIO;
const FALLBACK_IMAGE = require("../../../../../assets/images/hotel/hotel.jpg");

type HotelImageHeaderProps = {
  image?: string | ProviderImageSource | null;
  images?: Array<string | ProviderImageSource | null>;
  entityId?: string | null;
};

export default function HotelImageHeader({
  image,
  images = [],
  entityId,
}: HotelImageHeaderProps) {
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
        keyExtractor={(_, index) => `hotel-header-image-${index}`}
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

      <SafeAreaView style={styles.headerControls} edges={["top"]}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.COLORS.textPrimary}
            />
          </TouchableOpacity>
          <SaveButton entityType="hotel" entityId={entityId} compact />
        </View>
      </SafeAreaView>

      {validSlides.length > 1 ? (
        <View style={styles.indicatorContainer}>
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
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: HEADER_HEIGHT,
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
  headerControls: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activeDot: {
    backgroundColor: theme.COLORS.white,
    width: 24,
  },
});
