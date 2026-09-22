import Constants from "expo-constants";
import { Platform } from "react-native";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

type JsonRecord = Record<string, unknown>;
type ApiPayload = JsonRecord | JsonRecord[] | null;

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  headers?: HeadersInit;
};

type ApiRequestWithBodyOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

function extractHost(candidate: string | null | undefined): string {
  if (!candidate || typeof candidate !== "string") return "";

  const trimmed = candidate.trim();
  if (!trimmed) return "";

  const withoutProtocol = trimmed.includes("://") ? trimmed.split("://")[1] : trimmed;
  const hostWithPort = withoutProtocol.split("/")[0];
  const host = hostWithPort.split(":")[0];

  return host && !LOOPBACK_HOSTS.has(host) ? host : "";
}

function getExpoHost(): string {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.linkingUri,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host) {
      return host;
    }
  }

  return "";
}

function resolveBaseUrl(baseUrl: string): string {
  const configuredBaseUrl = baseUrl.trim();
  const expoHost = getExpoHost();

  if (!configuredBaseUrl) {
    return "";
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredBaseUrl);
  } catch {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be a valid URL.");
  }

  if (!LOOPBACK_HOSTS.has(parsedUrl.hostname)) {
    return parsedUrl.toString().replace(/\/+$/, "");
  }

  if (Platform.OS === "web") {
    return parsedUrl.toString().replace(/\/+$/, "");
  }

  if (Platform.OS === "android") {
    parsedUrl.hostname = expoHost || "10.0.2.2";
  } else if (expoHost) {
    parsedUrl.hostname = expoHost;
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

export const API_BASE_URL = resolveBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || "");
export const SOCKET_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

async function readJson(response: Response): Promise<ApiPayload> {
  try {
    return (await response.json()) as ApiPayload;
  } catch {
    return {};
  }
}

export function extractApiMessage(payload: ApiPayload, fallback: string): string {
  if (payload && !Array.isArray(payload) && typeof payload.detail === "string") {
    return payload.detail;
  }

  if (payload && !Array.isArray(payload) && Array.isArray(payload.detail) && payload.detail.length > 0) {
    const first = payload.detail[0] as { msg?: unknown };
    if (typeof first?.msg === "string") {
      return first.msg;
    }
  }

  if (payload && !Array.isArray(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  if (payload && !Array.isArray(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch (networkErr: unknown) {
    clearTimeout(timeout);
    if (networkErr instanceof Error && networkErr.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw new Error(`Network error. Unable to reach ${API_BASE_URL}.`);
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(extractApiMessage(payload, `Request failed (${response.status}).`));
  }

  if (payload && !Array.isArray(payload) && "data" in payload) {
    return payload.data as TResponse;
  }

  return payload as TResponse;
}

export async function apiGet<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "GET",
    ...options,
  });
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiRequestWithBodyOptions = {},
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}

export async function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiRequestWithBodyOptions = {},
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...options,
  });
}

export async function apiDelete<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "DELETE",
    ...options,
  });
}
