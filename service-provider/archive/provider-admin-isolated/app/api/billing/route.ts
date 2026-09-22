import { NextRequest, NextResponse } from "next/server";
import { proxyGet, proxyPost, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return proxyGet(request, "/platform-admin/billing/overview");
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorCode, action, totalRevenue, commissionRate, commissionAmount } = body;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers["Authorization"] = auth;

    if (action === "markPaid") {
      const res = await fetch(backendUrl(`/platform-admin/billing/payments/${vendorCode}/mark-paid`), {
        method: "POST",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    } else if (action === "sendReminder") {
      const res = await fetch(backendUrl(`/platform-admin/billing/payments/${vendorCode}/send-reminder`), {
        method: "POST",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    } else if (action === "updateBreakdown") {
      const res = await fetch(backendUrl(`/platform-admin/billing/payments/${vendorCode}`), {
        method: "PATCH",
        headers,
        body: JSON.stringify({ totalRevenue, commissionRate, commissionAmount }),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
