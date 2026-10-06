import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { mapSupportTicket } from "@/lib/support";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Tickets from app users and service providers (one collection on the backend).
export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const url = new URL(backendUrl("/platform-admin/support/tickets"));
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await backendFetch(url, { method: "GET", headers, cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { tickets?: unknown[] };
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }
    return NextResponse.json({
      tickets: Array.isArray(payload.tickets) ? payload.tickets.map(mapSupportTicket) : [],
    });
  } catch {
    return NextResponse.json({ detail: "The backend did not respond in time." }, { status: 502 });
  }
}
