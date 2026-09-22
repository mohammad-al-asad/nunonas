// @ts-nocheck
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import { createPlanSession, revealPlan, setPlanBudget, setPlanCompanions, setPlanMood, setPlanPreferences } from "../../../../lib/customer-api";
import { showToast } from "../../../../lib/toast";

// Import Components
import Step1 from "../../../../components/tabs/home/plan/Step1";
import Step2 from "../../../../components/tabs/home/plan/Step2";
import Step3 from "../../../../components/tabs/home/plan/Step3";
import Step4 from "../../../../components/tabs/home/plan/Step4";

export default function PlanScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [planData, setPlanData] = useState({
    companion: "",
    vibe: "",
    budget: "",
    area: "Anywhere",
    vouchersOnly: false,
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const session = await createPlanSession();
      const sessionId = String(session?.id ?? session?._id ?? session?.session_id ?? "");
      if (!sessionId) throw new Error("Could not create your planning session.");
      await Promise.all([
        setPlanCompanions(sessionId, planData.companion),
        setPlanMood(sessionId, planData.vibe),
        setPlanBudget(sessionId, planData.budget),
        setPlanPreferences(sessionId, { area: planData.area, vouchersOnly: planData.vouchersOnly }),
      ]);
      const result = await revealPlan(sessionId);
      setGeneratedPlan(result?.plan ?? null);
      setRecommendations(Array.isArray(result?.recommendations) ? result.recommendations : []);
      setCurrentStep(5);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create your personalized plan.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (generatedPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setGeneratedPlan(null)}><Ionicons name="arrow-back" size={24} color={theme.COLORS.textPrimary} /></TouchableOpacity>
          <Text style={styles.resultsHeader}>Your plan</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsTitle}>A plan made for you</Text>
          <Text style={styles.resultsSummary}>{generatedPlan.summary}</Text>
          <View style={styles.budgetBadge}><Text style={styles.budgetText}>Estimated budget: {generatedPlan.estimated_budget}</Text></View>
          <Text style={styles.resultsSectionTitle}>Your itinerary</Text>
          {(generatedPlan.steps ?? []).map((step, index) => (
            <View key={`${step.listing_id ?? step.title}-${index}`} style={styles.stepCard}>
              <View style={styles.stepTime}><Text style={styles.stepTimeText}>{step.time}</Text></View>
              <View style={styles.stepBody}><Text style={styles.stepTitle}>{step.title}</Text>{step.listing_name && <Text style={styles.stepListing}>{step.listing_name}</Text>}{step.note && <Text style={styles.stepNote}>{step.note}</Text>}</View>
            </View>
          ))}
          <Text style={styles.resultsSectionTitle}>Recommended nearby places</Text>
          {recommendations.slice(0, 6).map((item, index) => (
            <TouchableOpacity key={`${item.type ?? item.entity_type}-${item.id}-${index}`} style={styles.recommendationCard} onPress={() => {
              const type = String(item.type ?? item.entity_type ?? "restaurant").toLowerCase();
              const route = type === "hotel" ? "hotels" : type === "spa" ? "spa" : type === "event" ? "events" : "dining";
              router.push(`/home/${route}/${item.id}`);
            }}>
              <View style={styles.recommendationIcon}><Ionicons name={String(item.type).toLowerCase() === "event" ? "calendar" : String(item.type).toLowerCase() === "spa" ? "leaf" : String(item.type).toLowerCase() === "hotel" ? "bed" : "restaurant"} size={20} color={theme.COLORS.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.recommendationTitle}>{item.name}</Text><Text style={styles.recommendationMeta}>{item.type} {item.distance_km != null ? `• ${Number(item.distance_km).toFixed(1)} km` : ""}</Text></View>
              <Ionicons name="chevron-forward" size={20} color={theme.COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            selectedId={planData.companion}
            onSelect={(id) => setPlanData({ ...planData, companion: id })}
          />
        );
      case 2:
        return (
          <Step2
            selectedId={planData.vibe}
            onSelect={(id) => setPlanData({ ...planData, vibe: id })}
          />
        );
      case 3:
        return (
          <Step3
            selectedId={planData.budget}
            onSelect={(id) => setPlanData({ ...planData, budget: id })}
          />
        );
      case 4:
        return (
          <Step4
            data={planData}
            setData={setPlanData}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) return !planData.companion;
    if (currentStep === 2) return !planData.vibe;
    if (currentStep === 3) return !planData.budget;
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
        {/* Placeholder for balance */}
      </View>

      {/* Content */}
      <View style={styles.content}>{submitting ? <View style={styles.loadingState}><ActivityIndicator size="large" color={theme.COLORS.primary} /><Text style={styles.loadingText}>Creating your personalized plan...</Text></View> : renderStep()}</View>

      {/* Footer Navigation (only for steps before the last one) */}
      {currentStep < 4 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isNextDisabled() && styles.continueButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isNextDisabled()}
          >
            <Text style={styles.continueButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.COLORS.border,
  },
  progressDotActive: {
    backgroundColor: theme.COLORS.primary,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  continueButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  resultsHeader: { fontSize: 18, fontWeight: "800", color: theme.COLORS.textPrimary },
  resultsContent: { padding: 20, paddingBottom: 50 },
  resultsTitle: { fontSize: 28, fontWeight: "900", color: theme.COLORS.textPrimary, marginTop: 12 },
  resultsSummary: { fontSize: 16, lineHeight: 24, color: theme.COLORS.textSecondary, marginTop: 10 },
  budgetBadge: { alignSelf: "flex-start", backgroundColor: "#eef2ff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 16 },
  budgetText: { color: theme.COLORS.primary, fontWeight: "800" },
  resultsSectionTitle: { fontSize: 19, fontWeight: "800", color: theme.COLORS.textPrimary, marginTop: 28, marginBottom: 12 },
  stepCard: { flexDirection: "row", gap: 12, backgroundColor: theme.COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 10 },
  stepTime: { width: 52 },
  stepTimeText: { color: theme.COLORS.primary, fontWeight: "800" },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: "800", color: theme.COLORS.textPrimary },
  stepListing: { fontSize: 14, color: theme.COLORS.primary, fontWeight: "700", marginTop: 4 },
  stepNote: { fontSize: 13, color: theme.COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  recommendationCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.COLORS.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  recommendationIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  recommendationTitle: { fontSize: 15, fontWeight: "800", color: theme.COLORS.textPrimary },
  recommendationMeta: { fontSize: 12, color: theme.COLORS.textSecondary, marginTop: 3, textTransform: "capitalize" },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  loadingText: { marginTop: 14, color: theme.COLORS.textSecondary, fontSize: 15 },
});


