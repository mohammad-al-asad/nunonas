import { headers } from "next/headers";
import { redirect } from "next/navigation";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return trimTrailingSlash(process.env.RENDER_EXTERNAL_URL);
  }

  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

function cookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

async function refreshVendorAccessToken(cookieHeader: string | null) {
  const refreshToken = cookieValue(cookieHeader, "nunos_vendor_refresh_token");
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${BACKEND_BASE_URL}/api/v1/vendor/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    detail?: string;
    message?: string;
  };

  if (!response.ok || !payload.access_token) {
    return null;
  }
  return payload.access_token;
}

function isAuthFailure(response: Response, payload: { detail?: string; message?: string }) {
  const message = `${payload.detail ?? ""} ${payload.message ?? ""}`.toLowerCase();
  return (
    response.status === 401 ||
    message.includes("invalid access token") ||
    message.includes("invalid refresh token") ||
    message.includes("not logged in")
  );
}

export async function fetchApiData<T extends object>(path: string): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = resolveBaseUrl();
  const headerList = await headers();
  const cookie = headerList.get("cookie");
  const requestUrl = `${baseUrl}${normalizedPath}`;
  let response = await fetch(requestUrl, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status === 401) {
    const refreshedAccessToken = await refreshVendorAccessToken(cookie);
    if (refreshedAccessToken) {
      response = await fetch(requestUrl, {
        headers: {
          ...(cookie ? { cookie } : {}),
          Authorization: `Bearer ${refreshedAccessToken}`,
        },
        cache: "no-store",
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(15_000),
      });
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
    if (isAuthFailure(response, payload)) {
      redirect("/auth/login");
    }
    throw new Error(payload.detail || payload.message || `Failed to load ${normalizedPath}`);
  }

  return (await response.json()) as T;
}
