import { NextRequest } from "next/server";
import { proxyGet } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Every monthly invoice for one provider (payment history).
export async function GET(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  return proxyGet(request, `/platform-admin/billing/providers/${encodeURIComponent(vendorId)}/invoices`);
}
