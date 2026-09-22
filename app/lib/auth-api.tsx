import { API_BASE_URL, extractApiMessage } from "./api";
import { getSession, refreshSession, restoreSession } from "./auth-session";

type AuthPayload = Record<string, unknown>;

type AuthRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  headers?: HeadersInit;
};

type AuthRequestWithBodyOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

async function getAccessToken(): Promise<string | null> {
  const restoredSession = await restoreSession();
  return restoredSession.accessToken ?? getSession().accessToken;
}

function withAuthorization(headers: HeadersInit | undefined, accessToken: string): HeadersInit {
  return {
    ...(headers ?? {}),
    Authorization: `Bearer ${accessToken}`,
  };
}

async function readJson(response: Response): Promise<AuthPayload> {
  try {
    return (await response.json()) as AuthPayload;
  } catch {
    return {};
  }
}

async function authRequest<TResponse>(
  path: string,
  options: AuthRequestOptions = {},
  retryOnUnauthorized = true,
): Promise<TResponse> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: withAuthorization(
      {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      accessToken,
    ),
  });

  const payload = await readJson(response);
  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedSession = await refreshSession();
    if (refreshedSession.accessToken) {
      return authRequest<TResponse>(path, options, false);
    }
  }

  if (!response.ok) {
    throw new Error(extractApiMessage(payload, `Request failed (${response.status}).`));
  }

  return ("data" in payload ? payload.data : payload) as TResponse;
}

export async function apiGetAuth<TResponse>(
  path: string,
  options: AuthRequestOptions = {},
): Promise<TResponse> {
  return authRequest<TResponse>(path, {
    method: "GET",
    ...options,
  });
}

export async function apiPatchAuth<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: AuthRequestWithBodyOptions = {},
): Promise<TResponse> {
  return authRequest<TResponse>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...options,
  });
}

export async function apiPostAuth<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: AuthRequestWithBodyOptions = {},
): Promise<TResponse> {
  return authRequest<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}

export async function apiDeleteAuth<TResponse>(
  path: string,
  options: AuthRequestOptions = {},
): Promise<TResponse> {
  return authRequest<TResponse>(path, {
    method: "DELETE",
    ...options,
  });
}

export async function apiPostAuthForm<TResponse>(
  path: string,
  formData: FormData,
  options: AuthRequestOptions = {},
  retryOnUnauthorized = true,
): Promise<TResponse> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("You are not logged in.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: withAuthorization(options.headers, accessToken),
      ...options,
    });
  } catch (networkErr: unknown) {
    clearTimeout(timeout);
    if (networkErr instanceof Error && networkErr.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw new Error("Network error. Please check your internet connection.");
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readJson(response);
  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedSession = await refreshSession();
    if (refreshedSession.accessToken) {
      return apiPostAuthForm<TResponse>(path, formData, options, false);
    }
  }

  if (!response.ok) {
    throw new Error(extractApiMessage(payload, `Request failed (${response.status}).`));
  }

  return ("data" in payload ? payload.data : payload) as TResponse;
}
