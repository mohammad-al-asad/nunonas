// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";

const ChatMessage = ({ text, sender, time, isTyping }) => {
  const isAI = sender === "ai";

  return (
    <View
      style={[
        styles.container,
        isAI ? styles.aiContainer : styles.userContainer,
      ]}
    >
      {isAI && (
        <View style={styles.avatar}>
          <View style={styles.gradientCircle}>
            <Ionicons name="help" size={16} color={theme.COLORS.white} />
          </View>
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isAI ? styles.aiBubble : styles.userBubble,
            isTyping && styles.typingBubble,
          ]}
        >
          {isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          ) : (
            <Text style={[styles.text, isAI ? styles.aiText : styles.userText]}>
              {text}
            </Text>
          )}
        </View>

        {time && (
          <Text style={[styles.time, isAI ? styles.aiTime : styles.userTime]}>
            {time}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 24,
    width: "100%",
  },
  aiContainer: {
    justifyContent: "flex-start",
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  avatar: {
    marginRight: 12,
    marginTop: 4,
  },
  gradientCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6", // Bright Blue
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleWrapper: {
    maxWidth: "80%",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: theme.COLORS.surface,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: theme.COLORS.primary,
    borderTopRightRadius: 4,
  },
  typingBubble: {
    paddingVertical: 16,
    width: 60,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: theme.COLORS.textPrimary,
  },
  userText: {
    color: theme.COLORS.white,
  },
  time: {
    fontSize: 11,
    color: theme.COLORS.textSecondary,
    marginTop: 6,
  },
  aiTime: {
    textAlign: "left",
  },
  userTime: {
    textAlign: "right",
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.COLORS.textSecondary,
    opacity: 0.5,
  },
});

export default ChatMessage;


