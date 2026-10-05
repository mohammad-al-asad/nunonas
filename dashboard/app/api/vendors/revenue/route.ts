import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Revenue contribution per provider type and per provider (for the Service Providers charts).
export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await backendFetch(backendUrl("/platform-admin/dashboard/revenue-by-provider"), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "The backend did not respond in time." }, { status: 502 });
  }
}
