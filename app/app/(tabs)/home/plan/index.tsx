// @ts-nocheck
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
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
import PlanResults from "../../../../components/tabs/home/plan/PlanResults";

export default function PlanScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [planData, setPlanData] = useState({
    companion: "",
    vibe: "",
    customVibe: "",
    budget: "",
    area: "Anywhere",
    vouchersOnly: false,
  });
  const [plans, setPlans] = useState([]);
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
        setPlanMood(sessionId, planData.vibe === "custom" ? planData.customVibe.trim() : planData.vibe),
        setPlanBudget(sessionId, planData.budget),
        setPlanPreferences(sessionId, { area: planData.area, vouchersOnly: planData.vouchersOnly }),
      ]);
      const result = await revealPlan(sessionId);
      const nextPlans = Array.isArray(result?.plans) ? result.plans : result?.plan ? [result.plan] : [];
      if (!nextPlans.length) throw new Error("We couldn't build a plan right now. Please try again.");
      setPlans(nextPlans);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create your personalized plan.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (plans.length) {
    return (
      <PlanResults
        plans={plans}
        preferences={{
          companion: planData.companion,
          mood: planData.vibe === "custom" ? planData.customVibe.trim() : planData.vibe,
          budget: planData.budget,
          area: planData.area,
        }}
        onBack={() => setPlans([])}
        onStartOver={() => {
          setPlans([]);
          setCurrentStep(1);
        }}
      />
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
            customValue={planData.customVibe}
            onCustomChange={(text) => setPlanData({ ...planData, customVibe: text })}
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
    if (currentStep === 2) return !planData.vibe || (planData.vibe === "custom" && !planData.customVibe.trim());
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

      {/* Keeps the custom-vibe input and the Next button above the keyboard (edge-to-edge Android doesn't resize). */}
      <KeyboardAvoidingView style={styles.content} behavior="padding">
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
      </KeyboardAvoidingView>
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
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  loadingText: { marginTop: 14, color: theme.COLORS.textSecondary, fontSize: 15 },
});


