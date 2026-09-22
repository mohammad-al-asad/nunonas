// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import theme from "../../../../../constants/theme";
import ImageViewer from "../../../../ui/ImageViewer";
import { getHotelGallery } from "../../../../../lib/customer-api";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 55) / 2;

const HotelGalleryContent = ({ hotelId }) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await getHotelGallery(hotelId);
        const items = (res.items || []).map((item, index) => {
          const height = index % 4 === 0 ? 200 : index % 4 === 1 ? 160 : index % 4 === 2 ? 180 : 220;
          return {
            id: item.id || String(index),
            source: typeof item.asset_url === "string" ? { uri: item.asset_url } : item.asset_url,
            height,
          };
        });
        setImages(items);
      } catch (err) {
        console.error("Failed to fetch gallery images:", err);
      } finally {
        setLoading(false);
      }
    }
    if (hotelId) fetchGallery();
  }, [hotelId]);

  const handleImagePress = (source) => {
    setSelectedImage(source);
    setViewerVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40 }]}>
        <ActivityIndicator size="small" color="#1e3a8a" />
      </View>
    );
  }

  if (images.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingVertical: 40 }]}>
        <Text style={{ fontWeight: "700", color: "#64748b" }}>No gallery images available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.column}>
          {images.filter((_, i) => i % 2 === 0).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleImagePress(item.source)}
            >
              <Image
                source={item.source}
                style={[styles.image, { height: item.height }]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.column}>
          {images.filter((_, i) => i % 2 !== 0).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleImagePress(item.source)}
            >
              <Image
                source={item.source}
                style={[styles.image, { height: item.height }]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ImageViewer
        isVisible={viewerVisible}
        imageSource={selectedImage}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: theme.COLORS.white,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: COLUMN_WIDTH,
    gap: 15,
  },
  image: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: theme.COLORS.surface,
    resizeMode: "cover",
  },
});

export default HotelGalleryContent;


