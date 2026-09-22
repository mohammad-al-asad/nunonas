// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../constants/theme";

const ReviewModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || review.trim().length < 2 || submitting) return;
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ rating, review: review.trim() });
      }
      setRating(0);
      setReview("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={0}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.card}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.header}>
                  <Text style={styles.title}>Write a Review</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.COLORS.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Your Rating</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                      >
                        <Ionicons
                          name={star <= rating ? "star" : "star-outline"}
                          size={32}
                          color={star <= rating ? "#FFD700" : "#CBD5E1"}
                          style={styles.starIcon}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Your Review</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Share your experience..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={review}
                    onChangeText={setReview}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (rating === 0 || review.trim().length < 2 || submitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0 || review.trim().length < 2 || submitting}
                >
                  <Text style={styles.submitButtonText}>{submitting ? "Submitting..." : "Submit Review"}</Text>
                </TouchableOpacity>
                </ScrollView>
              </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    alignSelf: "center",
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    ...theme.SHADOWS.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569", // Slate-600
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  starIcon: {
    marginRight: 4,
  },
  textArea: {
    backgroundColor: theme.COLORS.white,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Slate-200
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: theme.COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    ...theme.SHADOWS.primary,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8", // Slate-400
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ReviewModal;


