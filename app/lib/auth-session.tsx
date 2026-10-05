import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ApiError, apiPost } from "./api";
import { queryClient } from "./queryClient";
import { showToast } from "./toast";

const SESSION_STORAGE_KEY = "nuno_auth_session";

export type AuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
};

type SessionStoragePayload = {
  accessToken?: unknown;
  refreshToken?: unknown;
  sessionToken?: unknown;
};

type RefreshSessionResponse = {
  access_token?: string | null;
  refresh_token?: string | null;
  session_token?: string | null;
};

let session: AuthSession = {
  accessToken: null,
  refreshToken: null,
};

function normalizeSessionPayload(payload: SessionStoragePayload | null | undefined): AuthSession {
  return {
    accessToken: typeof payload?.accessToken === "string" ? payload.accessToken : null,
    refreshToken:
      typeof payload?.refreshToken === "string"
        ? payload.refreshToken
        : typeof payload?.sessionToken === "string"
          ? payload.sessionToken
          : null,
  };
}

export async function hydrateSession(): Promise<AuthSession> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return session;
    }

    const parsed = JSON.parse(raw) as SessionStoragePayload;
    session = normalizeSessionPayload(parsed);
  } catch {
    session = {
      accessToken: null,
      refreshToken: null,
    };
  }

  return session;
}

// Shared so that several requests failing at once trigger a single refresh call.
let refreshInFlight: Promise<AuthSession> | null = null;

/** True when the server rejected the session itself (expired/revoked refresh token, deleted or blocked account). */
function isSessionRejected(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/** Sign the user out locally and send them to the login screen. */
export async function expireSession(): Promise<void> {
  const wasSignedIn = Boolean(session.accessToken || session.refreshToken);
  await clearSession();
  queryClient.clear();
  if (wasSignedIn) {
    showToast("Your session has expired. Please log in again.", { type: "info" });
    router.replace("/auth/login");
  }
}

async function requestRefresh(refreshToken: string): Promise<AuthSession> {
  const nextSession = await apiPost<RefreshSessionResponse, { refresh_token: string }>(
    "/api/v1/auth/refresh",
    {
      refresh_token: refreshToken,
    },
  );

  session = {
    accessToken: nextSession.access_token ?? null,
    refreshToken: nextSession.refresh_token ?? nextSession.session_token ?? refreshToken,
  };
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

/**
 * Exchange the refresh token for a new access token. If the server rejects the
 * session it is cleared and the user is sent to login; network errors keep the
 * session so the next request can try again.
 */
export async function refreshSession({ redirectOnExpiry = true } = {}): Promise<AuthSession> {
  const expire = redirectOnExpiry ? expireSession : clearSession;
  if (!session.refreshToken) {
    await expire();
    return session;
  }

  if (!refreshInFlight) {
    refreshInFlight = requestRefresh(session.refreshToken)
      .catch(async (error: unknown) => {
        if (isSessionRejected(error)) {
          await expire();
          return session;
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function restoreSession(): Promise<AuthSession> {
  await hydrateSession();

  if (session.accessToken) {
    return session;
  }

  if (!session.refreshToken) {
    await clearSession();
    return session;
  }

  try {
    // Called during startup (AuthGate); it handles the redirect itself.
    return await refreshSession({ redirectOnExpiry: false });
  } catch {
    // Offline or server unreachable: keep the stored session for the next attempt.
    return session;
  }
}

export async function setSession(
  nextSession: Partial<AuthSession> & { sessionToken?: string | null },
): Promise<void> {
  session = normalizeSessionPayload(nextSession);
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession {
  return session;
}

export async function logoutSession(): Promise<void> {
  const refreshToken = session.refreshToken;
  if (refreshToken) {
    try {
      await apiPost<unknown, { refresh_token: string }>("/api/v1/auth/logout", {
        refresh_token: refreshToken,
      });
    } catch {
      // Best-effort revoke; local session is still cleared below.
    }
  }

  await clearSession();
}

export async function clearSession(): Promise<void> {
  session = {
    accessToken: null,
    refreshToken: null,
  };
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
