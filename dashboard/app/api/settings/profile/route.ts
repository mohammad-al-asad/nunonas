import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function proxyProfile(request: NextRequest, method: "GET" | "PATCH") {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const init: RequestInit = {
      method,
      headers,
      cache: "no-store"
    };

    if (method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      init.body = JSON.stringify(body);
    }

    const response = await backendFetch(backendUrl("/platform-admin/settings/profile"), init);
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", detail: "The backend did not respond in time." },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyProfile(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return proxyProfile(request, "PATCH");
}
