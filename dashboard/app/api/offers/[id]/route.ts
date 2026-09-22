import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { mapAdminOffer } from "@/lib/offers-admin";

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

    const response = await fetch(backendUrl(`/platform-admin/offers/${id}`), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ offer: mapAdminOffer(payload) });
  } catch (error) {
    return NextResponse.json(
      { detail: `Failed to load offer: ${String(error)}` },
      { status: 502 },
    );
  }
}
