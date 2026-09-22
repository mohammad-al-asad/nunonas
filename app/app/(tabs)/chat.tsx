// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../constants/theme";

// Import Components
import ChatHeader from "../../components/tabs/chat/ChatHeader";
import ChatMessage from "../../components/tabs/chat/ChatMessage";
import ChatInput from "../../components/tabs/chat/ChatInput";

import {
  listAiSessions,
  createAiSession,
  listAiMessages,
  sendAiMessage,
} from "../../lib/customer-api";
import { SOCKET_BASE_URL } from "../../lib/api";
import { restoreSession } from "../../lib/auth-session";

function mapApiMessage(message) {
  return {
    id: message.id ?? message._id ?? String(Math.random()),
    sender: message.role === "user" ? "user" : "ai",
    text: message.content ?? message.message ?? "",
    time: message.created_at
      ? new Date(message.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now",
  };
}

function isMissingSessionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("ai session not found") || message.includes("404");
}

export default function ChatScreen() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize a session on mount
  const initSession = useCallback(async () => {
    try {
      setLoading(true);
      // Try to load existing sessions first
      let sid = null;
      try {
        const sessionsData = await listAiSessions();
        const sessions = sessionsData?.items ?? sessionsData ?? [];
        if (sessions.length > 0) {
          sid = sessions[0].id ?? sessions[0]._id;
        }
      } catch {
        // No existing sessions — create new
      }

      if (!sid) {
        const newSession = await createAiSession();
        sid = newSession?.id ?? newSession?._id;
      }

      setSessionId(sid);

      if (sid) {
        // Load messages for this session
        try {
          const msgData = await listAiMessages(sid);
          const msgs = msgData?.items ?? msgData ?? [];
          setMessages(msgs.map(mapApiMessage));
        } catch {
          // No messages yet — start fresh
          setMessages([
            {
              id: "welcome",
              sender: "ai",
              text: "Hello! I'm your personal AI concierge. Tell me what you'd like to do today!",
              time: "Just now",
            },
          ]);
        }
      }
    } catch (err) {
      console.warn("AI session init failed:", err.message);
      // Show welcome message as fallback
      setMessages([
        {
          id: "welcome",
          sender: "ai",
          text: "Hello! I'm your personal AI concierge. Tell me what you'd like to do today!",
          time: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    let active = true;

    async function connectSocket() {
      if (!sessionId) return;

      try {
        const session = await restoreSession();
        const token = session?.accessToken;
        const socketBase = SOCKET_BASE_URL;
        if (!token || !socketBase) return;

        const ws = new WebSocket(
          `${socketBase}/api/v1/customer/ai-concierge/sessions/${sessionId}/ws?token=${encodeURIComponent(token)}`
        );
        socketRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (!active || payload?.type !== "message") return;
            const assistantMessage = payload?.assistant_message;
            if (assistantMessage) {
              setMessages((prev) => [...prev, mapApiMessage(assistantMessage)]);
            }
            setSending(false);
          } catch {
            setSending(false);
          }
        };

        ws.onerror = () => {
          setSending(false);
        };

        ws.onclose = () => {
          setSending(false);
        };
      } catch {
        // Keep HTTP fallback behavior.
      }
    }

    connectSocket();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    let usingSocket = false;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSending(true);

    try {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        usingSocket = true;
        socket.send(JSON.stringify({ message: text, metadata: {} }));
        return;
      }

      if (sessionId) {
        let activeSessionId = sessionId;
        let reply;
        try {
          reply = await sendAiMessage(activeSessionId, text);
        } catch (error) {
          if (!isMissingSessionError(error)) {
            throw error;
          }

          const newSession = await createAiSession();
          activeSessionId = newSession?.id ?? newSession?._id ?? null;
          if (!activeSessionId) {
            throw error;
          }
          setSessionId(activeSessionId);
          reply = await sendAiMessage(activeSessionId, text);
        }

        const aiText =
          reply?.assistant_message?.content ??
          reply?.reply ??
          reply?.message ??
          reply?.content ??
          "Got it! Let me look into that for you.";
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_ai",
            sender: "ai",
            text: aiText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.warn("Failed to send AI message:", err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          sender: "ai",
          text: "Sorry, I'm having trouble responding right now. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      if (!usingSocket) {
        setSending(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ChatHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.COLORS.primary} />
            </View>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                text={msg.text}
                sender={msg.sender}
                time={msg.time}
              />
            ))
          )}

          {/* Typing Indicator while AI is responding */}
          {sending && <ChatMessage sender="ai" isTyping={true} />}
        </ScrollView>

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          disabled={sending || loading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
});


