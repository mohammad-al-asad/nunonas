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
  require("../../../../../assets/images/spa/menu/Rectangle 2.png"),
  require("../../../../../assets/images/spa/menu/Rectangle 3.png"),
  require("../../../../../assets/images/spa/menu/Rectangle 4.png"),
  require("../../../../../assets/images/spa/menu/Rectangle 5.png"),
];

type SpaMenuContentProps = {
  items?: ProviderPayload[];
};

function getSpaMenuImage(item: ProviderPayload): string | null {
  return item.asset_url ?? item.image_url ?? item.cover_image_url ?? item.image ?? item.url ?? null;
}

export default function SpaMenuContent({ items = [] }: SpaMenuContentProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | number | null>(null);

  const handleImagePress = (source: string | number) => {
    setSelectedImage(source);
    setViewerVisible(true);
  };

  const dynamicImages = items
    .map(getSpaMenuImage)
    .filter((item): item is string => Boolean(item));
  const images = dynamicImages.length ? dynamicImages : MENU_IMAGES;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {images.map((img, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageWrapper}
            activeOpacity={0.9}
            onPress={() => handleImagePress(img)}
          >
            <Image source={typeof img === "string" ? { uri: img } : img} style={styles.image} />
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
    height: COLUMN_WIDTH * 1.4,
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


