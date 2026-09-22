// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../../constants/theme";
import ProfileAvatarPlaceholder from "./ProfileAvatarPlaceholder";

const ProfileHeader = ({ name, email, imageUrl, onEditPress }) => {
  return (
    <View style={styles.header}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.headerContent}>
          <View style={styles.profileImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.profileImage} />
            ) : (
              <ProfileAvatarPlaceholder size={100} style={styles.profileImage} />
            )}
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{email}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.8}
            onPress={onEditPress}
          >
            <Ionicons name="pencil" size={16} color={theme.COLORS.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.COLORS.secondary, // Bright Blue
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: 20,
  },
  profileImageContainer: {
    padding: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 20,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    ...theme.SHADOWS.card,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.primary,
  },
});

export default ProfileHeader;


