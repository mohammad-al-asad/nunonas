// @ts-nocheck
import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const CustomImageViewer = ({ isVisible, imageSource, onClose }) => {
  // Convert single image to array format expected by the library
  const getImages = () => {
    if (!imageSource) return [];

    if (typeof imageSource === "string") {
      // Remote image (URL)
      return [{ url: imageSource }];
    } else {
      // Local image (require)
      return [
        {
          url: "", // Empty string for local images
          props: {
            source: imageSource, // Pass the require source here
          },
        },
      ];
    }
  };

  const images = getImages();

  return (
    <Modal visible={isVisible} transparent={true} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <View style={styles.container}>
        {/* Custom close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>

        {/* Image Viewer */}
        <ImageViewer
          imageUrls={images}
          enableSwipeDown={true} // Allow swipe down to close
          onSwipeDown={onClose} // Close on swipe down
          renderIndicator={() => null} // Hide page indicator (since we have only one image)
          backgroundColor="black" // Background color
          maxOverflow={0} // Prevent overflow beyond edges
          saveToLocalByLongPress={false} // Disable save option
          useNativeDriver={true} // Use native driver for animations
          enablePreload={true} // Preload images
          renderHeader={() => null} // No header
          onClick={onClose} // Close on single tap
          style={styles.viewer}
          // Double tap to zoom
          doubleClickInterval={300}
          enableImageZoom={true} // Enable zoom
          minScale={1} // Minimum zoom scale
          maxScale={4} // Maximum zoom scale
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 999,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
  },
  viewer: {
    flex: 1,
  },
});

export default CustomImageViewer;


