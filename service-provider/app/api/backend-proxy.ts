/**
 * backend-proxy.ts
 * Helper to proxy Next.js API route requests to the FastAPI backend.
 * Forwards Authorization headers or falls back to nunos_vendor_access_token cookie.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");
const BACKEND_TIMEOUT_MS = 15_000;
const refreshRequests = new Map<string, Promise<string | null>>();

function fetchBackend(url: string, init: RequestInit = {}) {
  return fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS) });
}

export function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE_URL}/api/v1${normalized}`;
}

export function resolveAuthHeader(request: Request | NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth) return auth;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nunos_vendor_access_token=([^;]+)/);
  if (match && match[1]) {
    return `Bearer ${decodeURIComponent(match[1])}`;
  }

  if (request instanceof NextRequest) {
    const token = request.cookies.get("nunos_vendor_access_token")?.value;
    if (token) {
      return `Bearer ${token}`;
    }
  }

  return null;
}

function cookieValue(request: Request | NextRequest, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  if (request instanceof NextRequest) {
    return request.cookies.get(name)?.value ?? null;
  }

  return null;
}

async function refreshVendorAccessToken(request: Request | NextRequest): Promise<string | null> {
  const refreshToken = cookieValue(request, "nunos_vendor_refresh_token");
  if (!refreshToken) {
    return null;
  }

  const pending = refreshRequests.get(refreshToken);
  if (pending) return pending;

  const refresh = (async () => {
    const response = await fetchBackend(backendUrl("/vendor/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as { access_token?: string };
    return response.ok && payload.access_token ? payload.access_token : null;
  })().finally(() => refreshRequests.delete(refreshToken));
  refreshRequests.set(refreshToken, refresh);
  return refresh;
}

function applyVendorCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
): NextResponse {
  response.cookies.set("nunos_vendor_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("nunos_vendor_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  if (refreshToken) {
    response.cookies.set("nunos_vendor_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

function jsonFromBackend(data: unknown, upstream: Response): NextResponse {
  const response = NextResponse.json(data, { status: upstream.status });
  for (const name of ["server-timing", "x-request-id"]) {
    const value = upstream.headers.get(name);
    if (value) response.headers.set(name, value);
  }
  return response;
}

async function fetchBackendWithRefresh(
  request: Request | NextRequest,
  url: string,
  init: RequestInit,
): Promise<{ response: Response; accessToken?: string }> {
  const first = await fetchBackend(url, init);
  if (first.status !== 401) {
    return { response: first };
  }

  const accessToken = await refreshVendorAccessToken(request);
  if (!accessToken) {
    return { response: first };
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const retry = await fetchBackend(url, { ...init, headers });
  return { response: retry, accessToken };
}

export async function proxyGet(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const url = new URL(backendUrl(backendPath));
    // Forward query params from the incoming request
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    const nextResponse = jsonFromBackend(data, res);
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export async function proxyPost(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const contentType = request.headers.get("content-type") || "application/json";
    const isJson = contentType.includes("application/json");
    const body: BodyInit = isJson
      ? JSON.stringify(await request.json().catch(() => ({})))
      : await request.arrayBuffer();
    const headers: Record<string, string> = { "Content-Type": contentType };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, backendUrl(backendPath), {
      method: "POST",
      headers,
      body,
    });
    const data = await res.json().catch(() => ({}));
    const nextResponse = jsonFromBackend(data, res);
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export async function proxyPatch(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, backendUrl(backendPath), {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const nextResponse = jsonFromBackend(data, res);
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export async function proxyDelete(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  try {
    const headers: Record<string, string> = {};
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    const { response: res, accessToken } = await fetchBackendWithRefresh(request, backendUrl(backendPath), {
      method: "DELETE",
      headers,
    });
    const data = await res.json().catch(() => ({}));
    const nextResponse = jsonFromBackend(data, res);
    return accessToken ? applyVendorCookies(nextResponse, accessToken) : nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }
}
