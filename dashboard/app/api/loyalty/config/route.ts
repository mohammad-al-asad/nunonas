import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, proxyGet, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return proxyGet(request, "/platform-admin/loyalty/config");
}

export async function PUT(request: NextRequest) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;
    const response = await backendFetch(backendUrl("/platform-admin/loyalty/config"), {
      method: "PUT",
      headers,
      body: JSON.stringify(await request.json().catch(() => ({}))),
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "The backend did not respond in time." }, { status: 502 });
  }
}
