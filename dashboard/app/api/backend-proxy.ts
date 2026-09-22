/**
 * backend-proxy.ts
 * Helper to proxy Next.js API route requests to the FastAPI backend.
 * Forwards Authorization headers or falls back to nunos_dashboard_access_token cookie.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");
export const BACKEND_TIMEOUT_MS = 15_000;

export function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE_URL}/api/v1${normalized}`;
}

export function backendFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });
}

export function resolveAuthHeader(request: Request | NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth) return auth;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nunos_dashboard_access_token=([^;]+)/);
  if (match && match[1]) {
    return `Bearer ${decodeURIComponent(match[1])}`;
  }

  if (request instanceof NextRequest) {
    const token = request.cookies.get("nunos_dashboard_access_token")?.value;
    if (token) {
      return `Bearer ${token}`;
    }
  }

  return null;
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

    const res = await backendFetch(url, { method: "GET", headers, cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}

export async function proxyPost(
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

    const res = await backendFetch(backendUrl(backendPath), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", detail: "The backend did not respond in time." },
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

    const res = await backendFetch(backendUrl(backendPath), {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", detail: "The backend did not respond in time." },
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

    const res = await backendFetch(backendUrl(backendPath), {
      method: "DELETE",
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}
