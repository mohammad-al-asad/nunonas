import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const headers: Record<string, string> = {};
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await backendFetch(backendUrl("/platform-admin/settings/profile/avatar"), {
      method: "POST",
      headers,
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", detail: "The backend did not respond in time." },
      { status: 502 }
    );
  }
}
