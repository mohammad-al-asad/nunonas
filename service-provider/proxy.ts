import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/registration-submitted",
  "/auth/forgot-password",
  "/auth/verify-code",
  "/auth/verify-otp",
  "/auth/reset-password",
  "/auth/password-changed",
  "/auth/legal",
];

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function accessTokenNeedsRefresh(token: string | undefined): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const expiresAtMs = payload.exp * 1000;
  return expiresAtMs <= Date.now() + 30_000;
}

function clearVendorCookies(response: NextResponse) {
  for (const name of [
    "nunos_vendor_auth",
    "nunos_vendor_access_token",
    "nunos_vendor_refresh_token",
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}

async function refreshVendorSession(refreshToken: string): Promise<{
  access_token?: string;
  refresh_token?: string;
  session_token?: string;
} | null> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/v1/vendor/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    session_token?: string;
  };

  if (!response.ok || !payload.access_token) {
    return null;
  }
  return payload;
}

function applyVendorSessionCookies(
  response: NextResponse,
  payload: { access_token: string; refresh_token?: string; session_token?: string },
) {
  response.cookies.set("nunos_vendor_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("nunos_vendor_access_token", payload.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  response.cookies.set("nunos_vendor_refresh_token", payload.refresh_token ?? payload.session_token ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect legacy root auth routes to nested /auth/ routes
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/auth/register", request.url));
  }
  if (pathname === "/forgot-password") {
    return NextResponse.redirect(new URL("/auth/forgot-password", request.url));
  }
  if (pathname === "/reset-password") {
    return NextResponse.redirect(new URL("/auth/reset-password", request.url));
  }
  if (pathname === "/verify-code" || pathname === "/auth/verify-code") {
    return NextResponse.redirect(new URL("/auth/verify-otp", request.url));
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/.well-known") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.get("nunos_vendor_auth")?.value === "true";
  if (!hasAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const accessToken = request.cookies.get("nunos_vendor_access_token")?.value;
  if (!accessTokenNeedsRefresh(accessToken)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("nunos_vendor_refresh_token")?.value;
  if (refreshToken) {
    const refreshed = await refreshVendorSession(refreshToken);
    if (refreshed?.access_token) {
      return applyVendorSessionCookies(NextResponse.next(), {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        session_token: refreshed.session_token,
      });
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return clearVendorCookies(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
