import { NextRequest } from "next/server";
import { proxyPost } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Body: { status: "PAID" | "UNPAID" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; period: string }> },
) {
  const { vendorId, period } = await params;
  return proxyPost(
    request,
    `/platform-admin/billing/providers/${encodeURIComponent(vendorId)}/invoices/${encodeURIComponent(period)}/status`,
  );
}
