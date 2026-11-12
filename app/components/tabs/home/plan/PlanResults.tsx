// @ts-nocheck
import React, { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../../constants/theme";
import { refinePlan } from "../../../../lib/customer-api";
import { showToast } from "../../../../lib/toast";

// One-tap ideas for the "Change this plan" box.
const QUICK_CHANGES = ["Add a spa", "Add a happy hour", "Make it cheaper", "Swap the first stop"];

const TYPE_META = {
  restaurant: { icon: "restaurant", label: "Dining", route: "dining" },
  hotel: { icon: "bed", label: "Stay", route: "hotels" },
  spa: { icon: "leaf", label: "Spa", route: "spa" },
  event: { icon: "calendar", label: "Event", route: "events" },
  happy_hour: { icon: "pricetag", label: "Happy hour", route: "dining" },
};

const CARD_ACCENTS = ["#1e3a8a", "#7c3aed"];

function typeMeta(type) {
  return TYPE_META[String(type ?? "").toLowerCase()] ?? { icon: "sparkles", label: "Stop", route: null };
}

function routeForStep(step) {
  if (step.detail_route) return step.detail_route;
  const meta = typeMeta(step.listing_type);
  return step.listing_id && meta.route ? `/home/${meta.route}/${step.listing_id}` : null;
}

function capitalize(value) {
  const text = String(value ?? "").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

function PreferenceChips({ preferences }) {
  const chips = [
    preferences.companion && { icon: "people", label: capitalize(preferences.companion) },
    preferences.mood && { icon: "happy", label: capitalize(preferences.mood) },
    preferences.budget && { icon: "wallet", label: capitalize(preferences.budget) },
    preferences.area && preferences.area !== "Anywhere" && { icon: "location", label: preferences.area },
  ].filter(Boolean);
  if (!chips.length) return null;
  return (
    <View style={styles.chips}>
      {chips.map((chip) => (
        <View key={chip.icon} style={styles.chip}>
          <Ionicons name={chip.icon} size={13} color="#c7d2fe" />
          <Text style={styles.chipText} numberOfLines={1}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}

function StopRow({ step, isLast, accent, onPress, onRemove }) {
  const meta = typeMeta(step.listing_type);
  const Container = onPress ? TouchableOpacity : View;
  return (
    <View style={styles.stopRow}>
      <View style={styles.timeline}>
        <Text style={[styles.stopTime, { color: accent }]}>{step.time}</Text>
        <View style={[styles.timelineDot, { borderColor: accent }]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <Container style={styles.stopCard} activeOpacity={0.85} onPress={onPress}>
        {step.image_url ? (
          <Image source={{ uri: step.image_url }} style={styles.stopImage} />
        ) : (
          <View style={[styles.stopImage, styles.stopImageFallback]}>
            <Ionicons name={meta.icon} size={20} color={accent} />
          </View>
        )}
        <View style={styles.stopBody}>
          <Text style={styles.stopTitle} numberOfLines={2}>{step.title}</Text>
          {(step.listing_name || step.listing_type) && (
            <View style={styles.stopMetaRow}>
              <Ionicons name={meta.icon} size={11} color={theme.COLORS.textSecondary} />
              <Text style={styles.stopMeta} numberOfLines={1}>
                {[meta.label, step.listing_name].filter(Boolean).join(" · ")}
              </Text>
            </View>
          )}
          {!!step.note && <Text style={styles.stopNote} numberOfLines={2}>{step.note}</Text>}
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={theme.COLORS.textSecondary} />}
      </Container>
      {onRemove ? (
        <TouchableOpacity style={styles.removeStop} onPress={onRemove} accessibilityLabel={`Remove ${step.title}`} hitSlop={8}>
          <Ionicons name="close" size={16} color={theme.COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PlanCard({ plan, index, onOpenStep, onRemoveStep, onRefine, refining }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const [request, setRequest] = useState("");
  const send = (text) => {
    const value = String(text ?? "").trim();
    if (value.length < 2 || refining) return;
    onRefine(value).then((ok) => {
      if (ok) setRequest("");
    });
  };
  const steps = plan.steps ?? [];
  const cover = steps.find((step) => step.image_url)?.image_url;
  return (
    <View style={styles.planCard}>
      <View style={[styles.cover, { backgroundColor: accent }]}>
        {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} /> : <Ionicons name="sparkles" size={42} color="rgba(255,255,255,0.35)" style={styles.coverIcon} />}
        <View style={styles.coverShade} />
        <View style={styles.coverTop}>
          <View style={styles.optionBadge}>
            <Text style={[styles.optionBadgeText, { color: accent }]}>Option {index + 1}</Text>
          </View>
          {!!plan.estimated_budget && (
            <View style={styles.budgetBadge}>
              <Ionicons name="wallet-outline" size={12} color={theme.COLORS.white} />
              <Text style={styles.budgetBadgeText}>{capitalize(plan.estimated_budget)}</Text>
            </View>
          )}
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.planTitle} numberOfLines={2}>{plan.title || `Plan ${index + 1}`}</Text>
          <Text style={styles.planStops}>{steps.length} {steps.length === 1 ? "stop" : "stops"}</Text>
        </View>
      </View>

      <View style={styles.planBody}>
        {!!plan.summary && <Text style={styles.planSummary}>{plan.summary}</Text>}
        <View style={styles.stops}>
          {steps.map((step, stepIndex) => {
            const route = routeForStep(step);
            return (
              <StopRow
                key={`${step.listing_id ?? step.title}-${stepIndex}`}
                step={step}
                accent={accent}
                isLast={stepIndex === steps.length - 1}
                onPress={route ? () => onOpenStep(route) : undefined}
                onRemove={steps.length > 1 && !refining ? () => onRemoveStep(stepIndex) : undefined}
              />
            );
          })}
        </View>

        <View style={styles.refine}>
          <Text style={styles.refineTitle}>Change this plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {QUICK_CHANGES.map((idea) => (
              <TouchableOpacity key={idea} style={styles.quickChip} onPress={() => send(idea)} disabled={refining} activeOpacity={0.8}>
                <Text style={[styles.quickChipText, { color: accent }]}>{idea}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.refineRow}>
            <TextInput
              value={request}
              onChangeText={setRequest}
              placeholder="e.g. add dinner after the spa"
              placeholderTextColor={theme.COLORS.textSecondary}
              style={styles.refineInput}
              editable={!refining}
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={() => send(request)}
            />
            <TouchableOpacity
              style={[styles.refineSend, { backgroundColor: accent }, (refining || request.trim().length < 2) && styles.refineSendDisabled]}
              onPress={() => send(request)}
              disabled={refining || request.trim().length < 2}
              accessibilityLabel="Update plan"
            >
              {refining ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PlanResults({ plans, preferences, onBack, onStartOver, sessionId, notice, onPlansChange }) {
  const router = useRouter();
  const [refiningIndex, setRefiningIndex] = useState(null);

  const removeStep = (planIndex, stepIndex) => {
    onPlansChange?.(
      plans.map((plan, index) =>
        index === planIndex ? { ...plan, steps: (plan.steps ?? []).filter((_, i) => i !== stepIndex) } : plan,
      ),
    );
  };

  const refine = async (planIndex, request) => {
    if (!sessionId) return false;
    setRefiningIndex(planIndex);
    try {
      // Send the plan as shown, so stops removed on the phone stay removed.
      const result = await refinePlan(sessionId, planIndex, request, plans[planIndex]);
      if (!result?.plan) throw new Error("We couldn't change your plan right now.");
      onPlansChange?.(plans.map((plan, index) => (index === planIndex ? result.plan : plan)));
      showToast("Plan updated.", { type: "success" });
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "We couldn't change your plan right now.", { type: "error" });
      return false;
    } finally {
      setRefiningIndex(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={theme.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your plans</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={20} color={theme.COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>Made just for you</Text>
          <Text style={styles.heroSubtitle}>
            {plans.length > 1 ? `${plans.length} plans` : "A plan"} picked from places near you. Tap any stop to see details.
          </Text>
          <PreferenceChips preferences={preferences} />
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={18} color="#1d4ed8" />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {plans.map((plan, index) => (
          <PlanCard
            key={`plan-${index}`}
            plan={plan}
            index={index}
            onOpenStep={(route) => router.push(route)}
            onRemoveStep={(stepIndex) => removeStep(index, stepIndex)}
            onRefine={(request) => refine(index, request)}
            refining={refiningIndex === index}
          />
        ))}

        <TouchableOpacity style={styles.startOver} onPress={onStartOver} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color={theme.COLORS.primary} />
          <Text style={styles.startOverText}>Try different answers</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.surface },
  flex: { flex: 1 },
  notice: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#eff6ff", borderRadius: 14, padding: 12, marginBottom: 16 },
  noticeText: { flex: 1, color: "#1e3a8a", fontSize: 13, lineHeight: 18 },
  removeStop: { alignSelf: "center", marginLeft: 6, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.COLORS.white, borderWidth: 1, borderColor: theme.COLORS.border },
  refine: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.COLORS.border },
  refineTitle: { fontSize: 14, fontWeight: "700", color: theme.COLORS.textPrimary, marginBottom: 10 },
  quickRow: { gap: 8, paddingBottom: 10 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.COLORS.surface, borderWidth: 1, borderColor: theme.COLORS.border },
  quickChipText: { fontSize: 13, fontWeight: "600" },
  refineRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  refineInput: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.COLORS.border, paddingHorizontal: 12, fontSize: 14, color: theme.COLORS.textPrimary, backgroundColor: theme.COLORS.white },
  refineSend: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  refineSendDisabled: { opacity: 0.5 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: theme.COLORS.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48, gap: 20 },

  hero: { borderRadius: 26, padding: 22, backgroundColor: theme.COLORS.primary, overflow: "hidden", ...theme.SHADOWS.primary },
  heroIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)", marginBottom: 14 },
  heroTitle: { fontSize: 26, fontWeight: "900", color: theme.COLORS.white },
  heroSubtitle: { fontSize: 14, lineHeight: 21, color: "#c7d2fe", marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "100%", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  chipText: { flexShrink: 1, fontSize: 12, fontWeight: "700", color: theme.COLORS.white },

  planCard: { borderRadius: 26, backgroundColor: theme.COLORS.white, overflow: "hidden", borderWidth: 1, borderColor: theme.COLORS.border, ...theme.SHADOWS.card },
  cover: { height: 176, justifyContent: "space-between" },
  coverIcon: { position: "absolute", alignSelf: "center", top: 60 },
  coverShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.42)" },
  coverTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  optionBadge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: theme.COLORS.white },
  optionBadgeText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.3 },
  budgetBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  budgetBadgeText: { fontSize: 12, fontWeight: "800", color: theme.COLORS.white },
  coverBottom: { padding: 16 },
  planTitle: { fontSize: 22, fontWeight: "900", color: theme.COLORS.white, lineHeight: 27 },
  planStops: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)" },

  planBody: { padding: 16, paddingTop: 14 },
  planSummary: { fontSize: 14, lineHeight: 21, color: theme.COLORS.textSecondary, marginBottom: 14 },
  stops: { gap: 10 },
  stopRow: { flexDirection: "row", gap: 10 },
  timeline: { width: 46, alignItems: "center" },
  stopTime: { fontSize: 12, fontWeight: "900", marginTop: 4 },
  timelineDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 3, backgroundColor: theme.COLORS.white, marginTop: 6 },
  timelineLine: { flex: 1, width: 2, marginTop: 4, marginBottom: -12, borderRadius: 1, backgroundColor: theme.COLORS.border },
  stopCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 11, padding: 10, borderRadius: 18, backgroundColor: theme.COLORS.surface, borderWidth: 1, borderColor: "#eef2f7" },
  stopImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: theme.COLORS.card },
  stopImageFallback: { alignItems: "center", justifyContent: "center" },
  stopBody: { flex: 1 },
  stopTitle: { fontSize: 14, fontWeight: "800", color: theme.COLORS.textPrimary, lineHeight: 19 },
  stopMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  stopMeta: { flexShrink: 1, fontSize: 12, fontWeight: "600", color: theme.COLORS.textSecondary },
  stopNote: { marginTop: 4, fontSize: 12, lineHeight: 17, color: "#475569" },

  startOver: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: "#c7d2fe", backgroundColor: theme.COLORS.white },
  startOverText: { fontSize: 15, fontWeight: "800", color: theme.COLORS.primary },
});
