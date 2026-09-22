// @ts-nocheck
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../constants/theme";

const ImagePickerModal = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Change Profile Photo</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelectCamera();
                    onClose();
                  }}
                >
                  <View
                    style={[styles.iconWrapper, { backgroundColor: "#EEF2FF" }]}
                  >
                    <Ionicons
                      name="camera"
                      size={24}
                      color={theme.COLORS.primary}
                    />
                  </View>
                  <Text style={styles.optionText}>Take Photo</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelectGallery();
                    onClose();
                  }}
                >
                  <View
                    style={[styles.iconWrapper, { backgroundColor: "#F0FDF4" }]}
                  >
                    <Ionicons
                      name="images"
                      size={24}
                      color={theme.COLORS.success}
                    />
                  </View>
                  <Text style={styles.optionText}>Choose from Gallery</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    padding: 20,
  },
  container: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...theme.SHADOWS.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
  },
  cancelButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
  },
});

export default ImagePickerModal;


