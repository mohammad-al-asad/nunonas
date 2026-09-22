import { NextResponse } from "next/server";
import { backendFetch, backendUrl } from "@/app/api/backend-proxy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json({ ok: false, message: "Email and code required." }, { status: 400 });
    }

    const response = await backendFetch(backendUrl("/platform-admin/auth/forgot-password/verify-code"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: email, validation_code: code }),
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      reset_token?: string;
      detail?: string;
      message?: string;
    };

    if (!response.ok || !payload.reset_token) {
      return NextResponse.json(
        { ok: false, message: payload.detail ?? payload.message ?? "Invalid verification code." },
        { status: response.status || 500 }
      );
    }

    const nextResponse = NextResponse.json({ ok: true }, { status: 200 });
    nextResponse.cookies.set("nunos_dashboard_reset_token", payload.reset_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    return nextResponse;
  } catch {
    return NextResponse.json({ ok: false, message: "Verification failed." }, { status: 500 });
  }
}
