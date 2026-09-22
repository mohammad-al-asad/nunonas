import { NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password required." }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/vendor/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      session_token?: string;
      vendor?: { email?: string };
      detail?: string;
      message?: string;
    };

    if (!response.ok || !payload.access_token) {
      return NextResponse.json(
        { ok: false, message: payload.detail ?? payload.message ?? "Login failed." },
        { status: response.status || 500 }
      );
    }

    const nextResponse = NextResponse.json(
      {
        ok: true,
        user: { email: payload.vendor?.email ?? email },
      },
      { status: 200 }
    );
    nextResponse.cookies.set("nunos_vendor_auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    nextResponse.cookies.set("nunos_vendor_access_token", payload.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
    if (payload.refresh_token || payload.session_token) {
      nextResponse.cookies.set("nunos_vendor_refresh_token", payload.refresh_token ?? payload.session_token ?? "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return nextResponse;
  } catch {
    return NextResponse.json({ ok: false, message: "Login failed." }, { status: 500 });
  }
}
