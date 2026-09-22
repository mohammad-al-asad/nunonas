import { NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json({ ok: false, message: "Email and code required." }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/vendor/auth/forgot-password/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_phone: email, validation_code: code }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
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
    nextResponse.cookies.set("nunos_vendor_reset_token", payload.reset_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    return nextResponse;
  } catch {
    return NextResponse.json({ ok: false, message: "Verification failed." }, { status: 500 });
  }
}
