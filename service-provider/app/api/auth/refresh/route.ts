import { NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { refresh_token?: string };
    const refreshToken = String(body.refresh_token ?? "").trim();

    if (!refreshToken) {
      return NextResponse.json({ ok: false, message: "Refresh token required." }, { status: 400 });
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
      refresh_token?: string;
      session_token?: string;
      detail?: string;
      message?: string;
    };

    if (!response.ok || !payload.access_token) {
      return NextResponse.json(
        { ok: false, message: payload.detail ?? payload.message ?? "Session refresh failed." },
        { status: response.status || 401 },
      );
    }

    const nextResponse = NextResponse.json(
      {
        ok: true,
        access_token: payload.access_token,
        refresh_token: payload.refresh_token ?? payload.session_token,
      },
      { status: 200 },
    );
    nextResponse.cookies.set("nunos_vendor_auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    nextResponse.cookies.set("nunos_vendor_access_token", payload.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    nextResponse.cookies.set("nunos_vendor_refresh_token", payload.refresh_token ?? payload.session_token ?? "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return nextResponse;
  } catch {
    return NextResponse.json({ ok: false, message: "Session refresh failed." }, { status: 500 });
  }
}
