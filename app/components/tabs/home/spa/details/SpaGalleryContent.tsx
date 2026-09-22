import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
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
    source: require("../../../../../assets/images/spa/galley/Rectangle 2.png"),
    height: 200,
  },
  {
    id: 2,
    source: require("../../../../../assets/images/spa/galley/Rectangle 3.png"),
    height: 160,
  },
  {
    id: 3,
    source: require("../../../../../assets/images/spa/galley/Rectangle 5.png"),
    height: 180,
  },
  {
    id: 4,
    source: require("../../../../../assets/images/spa/galley/Rectangle 7.png"),
    height: 220,
  },
  {
    id: 5,
    source: require("../../../../../assets/images/spa/galley/Rectangle 8.png"),
    height: 160,
  },
  {
    id: 6,
    source: require("../../../../../assets/images/spa/galley/Rectangle 9.png"),
    height: 200,
  },
];

type SpaGalleryItem = {
  id: number;
  source: string | number;
  height: number;
};

type SpaGalleryContentProps = {
  items?: ProviderPayload[];
};

function getSpaGalleryImage(item: ProviderPayload): string | null {
  return item.asset_url ?? item.image_url ?? item.cover_image_url ?? item.image ?? item.url ?? null;
}

export default function SpaGalleryContent({ items = [] }: SpaGalleryContentProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | number | null>(null);

  const handleImagePress = (source: string | number) => {
    setSelectedImage(source);
    setViewerVisible(true);
  };

  const dynamicItems: SpaGalleryItem[] = items
    .map(getSpaGalleryImage)
    .filter((item): item is string => Boolean(item))
    .map((source, index) => ({
      id: index + 1,
      source,
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
              onPress={() => handleImagePress(item.source)}
            >
              <Image
                source={typeof item.source === "string" ? { uri: item.source } : item.source}
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
              onPress={() => handleImagePress(item.source)}
            >
              <Image
                source={typeof item.source === "string" ? { uri: item.source } : item.source}
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
    resizeMode: "cover",
  },
});


