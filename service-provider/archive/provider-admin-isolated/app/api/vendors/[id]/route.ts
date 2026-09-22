import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
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

    const response = await fetch(backendUrl(`/platform-admin/vendors/${id}`), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ vendor: mapVendorDetailPayload(payload) });
  } catch (error) {
    return NextResponse.json({ detail: `Failed to load vendor: ${String(error)}` }, { status: 502 });
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
    body.action === "reject" || body.action === "block" ? "rejected" :
    null;

  if (!decision) {
    return NextResponse.json({ detail: "Invalid vendor action." }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await fetch(backendUrl(`/platform-admin/vendors/${id}/verification`), {
      method: "PATCH",
      headers,
      body: JSON.stringify({ decision }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json({ vendor: mapVendorListItem(payload) });
  } catch (error) {
    return NextResponse.json({ detail: `Failed to update vendor: ${String(error)}` }, { status: 502 });
  }
}
