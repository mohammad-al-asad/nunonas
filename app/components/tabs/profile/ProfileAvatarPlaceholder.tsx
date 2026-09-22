// @ts-nocheck
import React from "react";
import { View, StyleSheet } from "react-native";

const ProfileAvatarPlaceholder = ({ size = 100, style }) => {
  const headSize = size * 0.38;
  const bodyWidth = size * 0.68;
  const bodyHeight = size * 0.3;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.head,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.body,
          {
            width: bodyWidth,
            height: bodyHeight,
            borderTopLeftRadius: bodyHeight,
            borderTopRightRadius: bodyHeight,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
    overflow: "hidden",
  },
  head: {
    backgroundColor: "#D7D7D7",
    marginBottom: 6,
    marginTop: 6,
  },
  body: {
    backgroundColor: "#D7D7D7",
    position: "absolute",
    bottom: 14,
  },
});

export default ProfileAvatarPlaceholder;


