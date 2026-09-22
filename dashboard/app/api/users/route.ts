import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { buildUsersSummaryCards, mapAdminUserToProfile } from "@/lib/users-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(backendUrl("/platform-admin/users"));
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await backendFetch(url, { method: "GET", headers, cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as {
      users?: unknown[];
      detail?: string;
    };

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    const rawUsers = Array.isArray(payload.users) ? payload.users : [];
    const users = rawUsers.map(mapAdminUserToProfile);
    const createdAts = rawUsers.map((user) => {
      const record = user && typeof user === "object" ? (user as Record<string, unknown>) : {};
      return typeof record.created_at === "string" ? record.created_at : "";
    });

    return NextResponse.json({
      summaryCards: buildUsersSummaryCards(users, createdAts),
      users,
    });
  } catch {
    return NextResponse.json(
      { detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ detail: "Method not allowed." }, { status: 405 });
}
