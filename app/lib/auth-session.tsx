import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "./api";

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

export async function refreshSession(): Promise<AuthSession> {
  if (!session.refreshToken) {
    await clearSession();
    return session;
  }

  const nextSession = await apiPost<RefreshSessionResponse, { refresh_token: string }>(
    "/api/v1/auth/refresh",
    {
      refresh_token: session.refreshToken,
    },
  );

  session = {
    accessToken: nextSession.access_token ?? null,
    refreshToken: nextSession.refresh_token ?? nextSession.session_token ?? session.refreshToken,
  };
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
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
    return await refreshSession();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const isExpiredRefresh =
      message.includes("invalid refresh token") ||
      message.includes("user not found") ||
      message.includes("invalid token");

    if (isExpiredRefresh) {
      await clearSession();
    }

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
