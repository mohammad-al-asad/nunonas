import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { mapAdminUserToProfile } from "@/lib/users-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await backendFetch(backendUrl(`/platform-admin/users/${id}`), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ user: mapAdminUserToProfile(payload) });
  } catch {
    return NextResponse.json(
      { detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string; status?: string };
  const action = body.action ?? body.status;

  if (action === "resetPassword") {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const auth = resolveAuthHeader(request);
      if (auth) headers.Authorization = auth;

      const response = await backendFetch(backendUrl(`/platform-admin/users/${id}/password-reset-request`), {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({}));
      return NextResponse.json(payload, { status: response.status });
    } catch {
      return NextResponse.json({ detail: "The backend did not respond in time." }, { status: 502 });
    }
  }

  const statusValue =
    action === "block" || action === "blocked" ? "blocked" :
    action === "unblock" || action === "active" ? "active" :
    null;

  if (!statusValue) {
    return NextResponse.json({ detail: "Invalid user action." }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await backendFetch(backendUrl(`/platform-admin/users/${id}/status`), {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: statusValue }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ user: mapAdminUserToProfile(payload) });
  } catch {
    return NextResponse.json(
      { detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}
