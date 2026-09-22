// @ts-nocheck
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import theme from "../../constants/theme";
import Button from "../../components/ui/Button";
import { markOnboardingSeen } from "../../lib/onboarding";

const { width } = Dimensions.get("window");

const ONBOARDING_DATA = [
  {
    id: 1,
    title: "Discover Experiences\nNear You",
    description:
      "Find restaurants, events, and activities around metro stations and nearby areas.",
    image: require("../../assets/images/discover-experience.png"),
  },
  {
    id: 2,
    title: "Book Easily",
    description:
      "Reserve tables, save favorites, and discounts and exclusive offers.",
    image: require("../../assets/images/book-easily.png"),
  },
  {
    id: 3,
    title: "Plan Smarter with AI",
    description:
      "Get personalized date night plans and event recommendations instantly.",
    image: require("../../assets/images/plan-smarter-with-ai.png"),
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const finishOnboarding = async () => {
    await markOnboardingSeen();
    router.replace("/auth/login");
  };

  const handleNext = async () => {
    if (currentPage < ONBOARDING_DATA.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const data = ONBOARDING_DATA[currentPage];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={data.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Text Container */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.description}>{data.description}</Text>
        </View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Footer / Button Area */}
      <View style={styles.footer}>
        <Button
          title={
            currentPage === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"
          }
          onPress={handleNext}
          icon={<Text style={styles.arrow}> →</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  topBar: {
    height: 50,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.COLORS.surface,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  skipText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  imageContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  image: {
    width: width * 0.9,
    height: width * 0.9,
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingTop: 20,
  },
  title: {
    fontSize: theme.TYPOGRAPHY.h1.fontSize,
    fontWeight: theme.TYPOGRAPHY.h1.fontWeight,
    color: theme.COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: theme.TYPOGRAPHY.h1.lineHeight,
  },
  description: {
    fontSize: theme.TYPOGRAPHY.subtitle.fontSize,
    color: theme.COLORS.textSecondary,
    textAlign: "center",
    lineHeight: theme.TYPOGRAPHY.subtitle.lineHeight,
  },
  pagination: {
    flexDirection: "row",
    marginBottom: 40,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.COLORS.accent,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: theme.COLORS.border,
  },
  footer: {
    paddingHorizontal: theme.SPACING.containerPadding,
    paddingBottom: 30,
  },
  arrow: {
    color: theme.COLORS.white,
    fontSize: 22,
    fontWeight: "700",
  },
});


