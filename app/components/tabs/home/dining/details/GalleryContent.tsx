import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import theme from "../../../../../constants/theme";
import ImageViewer from "../../../../ui/ImageViewer";
import type { ProviderPayload } from "../../../../../lib/provider-types";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 55) / 2;

const GALLERY_IMAGES = [
  {
    id: 1,
    uri: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    height: 200,
  },
  {
    id: 2,
    uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    height: 160,
  },
  {
    id: 3,
    uri: "https://images.unsplash.com/photo-1550966842-1329a6566276?auto=format&fit=crop&w=600&q=80",
    height: 180,
  },
  {
    id: 4,
    uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
    height: 220,
  },
  {
    id: 5,
    uri: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=600&q=80",
    height: 160,
  },
  {
    id: 6,
    uri: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
    height: 200,
  },
  {
    id: 7,
    uri: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
    height: 180,
  },
  {
    id: 8,
    uri: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80",
    height: 220,
  },
];

type GalleryItem = {
  id: number;
  uri: string;
  height: number;
};

type GalleryContentProps = {
  items?: ProviderPayload[];
};

function getGalleryUri(item: ProviderPayload): string | null {
  return item.asset_url ?? item.image_url ?? item.cover_image_url ?? item.image ?? item.url ?? null;
}

export default function GalleryContent({ items = [] }: GalleryContentProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePress = (uri: string) => {
    setSelectedImage(uri);
    setViewerVisible(true);
  };

  const dynamicItems: GalleryItem[] = items
    .map(getGalleryUri)
    .filter((item): item is string => Boolean(item))
    .map((uri, index) => ({
      id: index + 1,
      uri,
      height: GALLERY_IMAGES[index % GALLERY_IMAGES.length]?.height ?? 180,
    }));
  const galleryItems = dynamicItems.length ? dynamicItems : GALLERY_IMAGES;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Left Column */}
        <View style={styles.column}>
          {galleryItems.filter((_, i) => i % 2 === 0).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleImagePress(item.uri)}
            >
              <Image
                source={{ uri: item.uri }}
                style={[styles.image, { height: item.height }]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          {galleryItems.filter((_, i) => i % 2 !== 0).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleImagePress(item.uri)}
            >
              <Image
                source={{ uri: item.uri }}
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
}

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
  },
});


