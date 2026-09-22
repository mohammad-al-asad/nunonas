import { NextResponse } from "next/server";

import { backendFetch, backendUrl } from "@/app/api/backend-proxy";

export async function POST(request: Request) {
  const refreshToken =
    request.headers.get("cookie")?.match(/nunos_dashboard_refresh_token=([^;]+)/)?.[1] ?? "";
  if (refreshToken) {
    try {
      await backendFetch(backendUrl("/platform-admin/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: decodeURIComponent(refreshToken) }),
        cache: "no-store",
      });
    } catch {
      // Best-effort revoke; cookies are cleared below regardless.
    }
  }
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("nunos_admin_auth", "", {
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
  response.cookies.set("nunos_dashboard_access_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("nunos_dashboard_refresh_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
