import { NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

export async function POST(request: Request) {
  const refreshToken =
    request.headers.get("cookie")?.match(/nunos_vendor_refresh_token=([^;]+)/)?.[1] ?? "";
  if (refreshToken) {
    try {
      await fetch(`${BACKEND_BASE_URL}/api/v1/vendor/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: decodeURIComponent(refreshToken) }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      // Best-effort revoke; cookies are cleared below regardless.
    }
  }
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("nunos_vendor_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("nunos_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("nunos_vendor_access_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("nunos_vendor_refresh_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("nunos_vendor_reset_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
