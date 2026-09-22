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
const COLUMN_WIDTH = (width - 60) / 2;

const MENU_IMAGES = [
  {
    uri: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    uri: "https://images.unsplash.com/photo-1544145945-f904253d0c71?auto=format&fit=crop&w=600&q=80",
  },
  {
    uri: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80",
  },
  {
    uri: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
  },
];

type MenuContentProps = {
  items?: ProviderPayload[];
};

function getImageUri(item: ProviderPayload): string | null {
  return item.asset_url ?? item.image_url ?? item.cover_image_url ?? item.image ?? item.url ?? null;
}

export default function MenuContent({ items = [] }: MenuContentProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePress = (uri: string) => {
    setSelectedImage(uri);
    setViewerVisible(true);
  };

  const images = items
    .map(getImageUri)
    .filter((item): item is string => Boolean(item));

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {(images.length ? images.map((uri) => ({ uri })) : MENU_IMAGES).map((img, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageWrapper}
            onPress={() => handleImagePress(img.uri)}
          >
            <Image source={{ uri: img.uri }} style={styles.image} />
          </TouchableOpacity>
        ))}
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
    padding: 20,
    backgroundColor: theme.COLORS.white,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 20,
  },
  imageWrapper: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.4, // Aspect ratio for menu pages
    borderRadius: 16,
    backgroundColor: theme.COLORS.surface,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});


