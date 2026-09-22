// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import theme from "../../../constants/theme";
import { getLegalDocument } from "../../../lib/customer-api";

function normalizeDocument(value) {
  return value === "privacy" ? "privacy" : "terms";
}

function renderContent(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^#+\s?/gm, "").replace(/[*_`]/g, "").trim();
}

export default function LegalDocumentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const documentKey = normalizeDocument(params.doc);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      try {
        setLoading(true);
        setError("");
        const response = await getLegalDocument(documentKey);
        const payload = response?.document ? response : response?.data;
        if (active) {
          setDocument(payload || null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load legal content.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDocument();
    return () => {
      active = false;
    };
  }, [documentKey]);

  const title = useMemo(() => {
    if (document?.title) return document.title;
    return documentKey === "privacy" ? "Privacy Policy" : "Terms & Conditions";
  }, [document, documentKey]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.updatedAt}>Last updated: {document?.lastUpdated || "Not available"}</Text>
            <Text style={styles.contentText}>{renderContent(document?.content)}</Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    paddingHorizontal: 12,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: theme.COLORS.error,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 20,
    padding: 20,
    backgroundColor: theme.COLORS.white,
    ...theme.SHADOWS.card,
  },
  updatedAt: {
    fontSize: 12,
    color: theme.COLORS.textSecondary,
    marginBottom: 14,
    fontWeight: "600",
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.COLORS.textPrimary,
  },
});


