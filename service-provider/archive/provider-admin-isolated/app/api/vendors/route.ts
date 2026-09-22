import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { buildVendorSummaryCards, mapVendorListItem } from "@/lib/vendors-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(backendUrl("/platform-admin/vendors"));
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await fetch(url.toString(), { method: "GET", headers, cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { vendors?: unknown[] };
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    const vendors = (Array.isArray(payload.vendors) ? payload.vendors : []).map(mapVendorListItem);
    return NextResponse.json({
      summaryCards: buildVendorSummaryCards(vendors),
      vendors,
    });
  } catch (error) {
    return NextResponse.json({ detail: `Failed to load vendors: ${String(error)}` }, { status: 502 });
  }
}
