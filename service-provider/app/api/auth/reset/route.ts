import { NextResponse } from "next/server";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body?.password ?? "");
    const resetToken = request.headers.get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("nunos_vendor_reset_token="))
      ?.split("=")[1];

    if (!password) {
      return NextResponse.json({ ok: false, message: "Password required." }, { status: 400 });
    }
    if (!resetToken) {
      return NextResponse.json({ ok: false, message: "Verification required." }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/vendor/auth/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reset_token: decodeURIComponent(resetToken),
        new_password: password,
        confirm_password: password,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: payload.detail ?? payload.message ?? "Reset failed." },
        { status: response.status || 500 }
      );
    }

    const nextResponse = NextResponse.json({ ok: true }, { status: 200 });
    nextResponse.cookies.set("nunos_vendor_reset_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
    return nextResponse;
  } catch {
    return NextResponse.json({ ok: false, message: "Reset failed." }, { status: 500 });
  }
}
