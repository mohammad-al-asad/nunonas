import { NextResponse } from "next/server";
import { backendUrl } from "@/app/api/backend-proxy";

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password required." }, { status: 400 });
    }

    const response = await fetch(backendUrl("/platform-admin/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: email, password }),
      cache: "no-store",
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      session_token?: string;
      admin?: { email?: string };
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
        user: { email: payload.admin?.email ?? email },
        access_token: payload.access_token,
        refresh_token: payload.refresh_token ?? payload.session_token,
      },
      { status: 200 }
    );
    nextResponse.cookies.set("nunos_admin_auth", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    nextResponse.cookies.set("nunos_dashboard_access_token", payload.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    if (payload.refresh_token || payload.session_token) {
      nextResponse.cookies.set("nunos_dashboard_refresh_token", payload.refresh_token ?? payload.session_token ?? "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return nextResponse;
  } catch (error) {
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "Authentication backend timed out."
      : "Authentication backend unavailable.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
