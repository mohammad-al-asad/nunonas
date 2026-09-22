// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../../../constants/theme";
import {
  createSupportTicket,
  getSupportTicket,
  listMySupportTickets,
  replyToSupportTicket,
} from "../../../lib/customer-api";

const ISSUE_OPTIONS = ["Account", "Technical", "Billing", "Compliance"];

function ticketStatusColor(status) {
  if (status === "Resolved") return theme.COLORS.success;
  if (status === "In Progress") return "#B45309";
  return theme.COLORS.primary;
}

function formatTicketDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SupportTicketItem = ({ ticket, onPress }) => (
  <TouchableOpacity style={styles.ticketCard} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.ticketHeader}>
      <Text style={styles.ticketId}>{ticket.id}</Text>
      <Text style={[styles.ticketStatus, { color: ticketStatusColor(ticket.status) }]}>
        {ticket.status}
      </Text>
    </View>
    <Text style={styles.ticketTitle}>{ticket.subject}</Text>
    <Text style={styles.ticketDate}>{formatTicketDate(ticket.created_at)}</Text>
  </TouchableOpacity>
);

export default function SupportScreen() {
  const router = useRouter();
  const [issueType, setIssueType] = useState("Technical");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [issueMenuOpen, setIssueMenuOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("tickets");

  const sortedTickets = useMemo(
    () => [...tickets].sort((left, right) => new Date(right.updated_at || 0) - new Date(left.updated_at || 0)),
    [tickets]
  );

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await listMySupportTickets();
      const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      setTickets(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const handleSubmit = async () => {
    if (!issueType) {
      setError("Please select an issue type.");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const response = await createSupportTicket({
        issue_type: issueType,
        subject: subject.trim(),
        description: description.trim(),
        priority: "medium",
      });
      const ticket = response?.id ? response : response?.data;
      if (ticket) {
        setTickets((prev) => [ticket, ...prev]);
      }
      setSubject("");
      setDescription("");
      setSuccess("Support request submitted.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTicket = async (ticket) => {
    try {
      setDetailLoading(true);
      setSelectedTicket(ticket);
      const latest = await getSupportTicket(ticket.id);
      const resolvedTicket = latest?.id ? latest : latest?.data;
      if (resolvedTicket) {
        setSelectedTicket(resolvedTicket);
        setTickets((prev) => prev.map((item) => (item.id === resolvedTicket.id ? resolvedTicket : item)));
      }
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Failed to load ticket details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedTicket?.id || !replyMessage.trim()) {
      return;
    }

    try {
      setReplySubmitting(true);
      const updated = await replyToSupportTicket(selectedTicket.id, replyMessage.trim());
      const resolvedTicket = updated?.id ? updated : updated?.data;
      if (resolvedTicket) {
        setSelectedTicket(resolvedTicket);
        setTickets((prev) => prev.map((item) => (item.id === resolvedTicket.id ? resolvedTicket : item)));
      }
      setReplyMessage("");
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Failed to send reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.COLORS.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionSwitch}>
          <TouchableOpacity
            style={[
              styles.sectionSwitchButton,
              activeSection === "tickets" ? styles.sectionSwitchButtonActive : null,
            ]}
            onPress={() => setActiveSection("tickets")}
          >
            <Text
              style={[
                styles.sectionSwitchText,
                activeSection === "tickets" ? styles.sectionSwitchTextActive : null,
              ]}
            >
              My Support Tickets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sectionSwitchButton,
              activeSection === "submit" ? styles.sectionSwitchButtonActive : null,
            ]}
            onPress={() => setActiveSection("submit")}
          >
            <Text
              style={[
                styles.sectionSwitchText,
                activeSection === "submit" ? styles.sectionSwitchTextActive : null,
              ]}
            >
              Submit Support Request
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === "tickets" ? (
          <View style={styles.ticketsSection}>
            <Text style={styles.sectionTitle}>My Support Tickets</Text>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={theme.COLORS.primary} />
              </View>
            ) : sortedTickets.length > 0 ? (
              sortedTickets.map((ticket) => (
                <SupportTicketItem
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => {
                    void handleOpenTicket(ticket);
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No support tickets yet.</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.formCard}>
              <Text style={styles.introText}>How can we help you today?</Text>
              <Text style={styles.formTitle}>Submit Support Request</Text>

              <TouchableOpacity style={styles.dropdown} onPress={() => setIssueMenuOpen((current) => !current)}>
                <Text style={styles.dropdownText}>
                  {issueType || "Select an issue type"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.COLORS.textPrimary}
                />
              </TouchableOpacity>
              {issueMenuOpen && (
                <View style={styles.dropdownMenu}>
                  {ISSUE_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,
                        index === ISSUE_OPTIONS.length - 1 ? styles.dropdownOptionLast : null,
                      ]}
                      onPress={() => {
                        setIssueType(option);
                        setIssueMenuOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownOptionText, issueType === option && styles.dropdownOptionTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brief description of your issue"
                  placeholderTextColor={theme.COLORS.textSecondary}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Please provide detailed information about your issue..."
                  placeholderTextColor={theme.COLORS.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {(error || success) ? (
                <Text style={[styles.feedbackText, { color: error ? "#DC2626" : theme.COLORS.success }]}>
                  {error || success}
                </Text>
              ) : null}

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitButtonText}>
                  {submitting ? "Submitting..." : "Submit Support Request"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedTicket)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedTicket(null);
          setReplyMessage("");
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 18 : 0}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedTicket?.subject || "Ticket Details"}</Text>
                <Text style={styles.modalMeta}>
                  {selectedTicket?.id} • {selectedTicket?.status}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedTicket(null);
                  setReplyMessage("");
                }}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color={theme.COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.detailLoadingWrap}>
                <ActivityIndicator color={theme.COLORS.primary} />
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.conversationWrap}
                  contentContainerStyle={styles.conversationContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.issueSummary}>
                    <Text style={styles.issueSummaryLabel}>{selectedTicket?.issue_type}</Text>
                    <Text style={styles.issueSummaryText}>{selectedTicket?.description}</Text>
                  </View>

                  {(selectedTicket?.messages || []).map((message, index) => {
                    const isAgent = message.sender === "agent";
                    return (
                      <View
                        key={`${message.time || "message"}-${index}`}
                        style={[styles.messageRow, isAgent ? styles.messageRowAgent : styles.messageRowUser]}
                      >
                        <View style={[styles.messageBubble, isAgent ? styles.messageBubbleAgent : styles.messageBubbleUser]}>
                          <Text style={[styles.messageText, isAgent ? styles.messageTextAgent : styles.messageTextUser]}>
                            {message.text}
                          </Text>
                        </View>
                        <Text style={styles.messageMeta}>
                          {message.name || (isAgent ? "Support" : "You")}
                          {" • "}
                          {formatTicketDate(message.time)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.replyBox}>
                  <View style={styles.replyComposerRow}>
                    <TextInput
                      style={[styles.input, styles.replyInput]}
                      placeholder="Write a reply..."
                      placeholderTextColor={theme.COLORS.textSecondary}
                      value={replyMessage}
                      onChangeText={setReplyMessage}
                      multiline
                      returnKeyType="send"
                      submitBehavior="submit"
                      onSubmitEditing={() => {
                        void handleReplySubmit();
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.submitButton, styles.replyButton, replySubmitting && styles.submitButtonDisabled]}
                      onPress={() => {
                        void handleReplySubmit();
                      }}
                      disabled={replySubmitting}
                    >
                      <Text style={styles.submitButtonText}>
                        {replySubmitting ? "Sending..." : "Send"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionSwitch: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  sectionSwitchButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    ...theme.SHADOWS.card,
  },
  sectionSwitchButtonActive: {
    backgroundColor: theme.COLORS.primary,
    borderColor: theme.COLORS.primary,
  },
  sectionSwitchText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textPrimary,
    textAlign: "center",
  },
  sectionSwitchTextActive: {
    color: theme.COLORS.white,
  },
  introText: {
    fontSize: 16,
    color: theme.COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: "500",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.COLORS.white,
    marginBottom: 20,
    ...theme.SHADOWS.card,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.COLORS.textPrimary,
    fontWeight: "500",
  },
  dropdownMenu: {
    marginTop: -12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 16,
    backgroundColor: theme.COLORS.white,
    overflow: "hidden",
    ...theme.SHADOWS.card,
  },
  dropdownOption: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: theme.COLORS.textPrimary,
  },
  dropdownOptionTextActive: {
    color: theme.COLORS.primary,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: theme.COLORS.white,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...theme.SHADOWS.card,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.COLORS.textSecondary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.COLORS.textPrimary,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  ticketsSection: {
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
    marginBottom: 15,
  },
  ticketCard: {
    backgroundColor: theme.COLORS.white,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    ...theme.SHADOWS.card,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  ticketStatus: {
    fontSize: 13,
    fontWeight: "700",
  },
  ticketTitle: {
    fontSize: 15,
    color: theme.COLORS.textSecondary,
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 13,
    color: theme.COLORS.textSecondary,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 18,
    padding: 18,
    backgroundColor: theme.COLORS.white,
  },
  emptyText: {
    fontSize: 14,
    color: theme.COLORS.textSecondary,
  },
  submitButton: {
    backgroundColor: theme.COLORS.primary,
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    ...theme.SHADOWS.primary,
  },
  submitButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "85%",
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.COLORS.textPrimary,
  },
  modalMeta: {
    marginTop: 4,
    fontSize: 13,
    color: theme.COLORS.textSecondary,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  detailLoadingWrap: {
    minHeight: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationWrap: {
    maxHeight: 420,
  },
  conversationContent: {
    paddingBottom: 12,
  },
  issueSummary: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  issueSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.COLORS.primary,
    marginBottom: 8,
  },
  issueSummaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.COLORS.textSecondary,
  },
  messageRow: {
    marginBottom: 12,
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  messageRowAgent: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  messageBubbleUser: {
    backgroundColor: theme.COLORS.primary,
    borderBottomRightRadius: 6,
  },
  messageBubbleAgent: {
    backgroundColor: "#F1F5F9",
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: theme.COLORS.white,
  },
  messageTextAgent: {
    color: theme.COLORS.textPrimary,
  },
  messageMeta: {
    marginTop: 6,
    fontSize: 11,
    color: theme.COLORS.textSecondary,
  },
  replyBox: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },
  replyComposerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  replyInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    marginBottom: 0,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  replyButton: {
    height: 48,
    minWidth: 88,
    paddingHorizontal: 18,
  },
});


