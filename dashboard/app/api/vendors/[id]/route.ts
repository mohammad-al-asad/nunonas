import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { mapVendorDetailPayload, mapVendorListItem } from "@/lib/vendors-admin";

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

    const response = await backendFetch(backendUrl(`/platform-admin/vendors/${id}`), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ vendor: mapVendorDetailPayload(payload) });
  } catch {
    return NextResponse.json({ detail: "The backend did not respond in time." }, { status: 502 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const decision =
    body.action === "approve" ? "approved" :
    body.action === "reject" ? "rejected" :
    body.action === "block" ? "blocked" :
    body.action === "cancel" ? "cancel" :
    null;

  if (!decision) {
    return NextResponse.json({ detail: "Invalid vendor action." }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await backendFetch(backendUrl(`/platform-admin/vendors/${id}/status`), {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: decision }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ vendor: mapVendorListItem(payload) });
  } catch {
    return NextResponse.json({ detail: "The backend did not respond in time." }, { status: 502 });
  }
}
