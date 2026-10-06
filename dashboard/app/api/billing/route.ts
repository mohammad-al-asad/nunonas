import { NextRequest } from "next/server";
import { proxyGet } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Monthly commission invoices + summary (?period=YYYY-MM, defaults to the current month).
export async function GET(request: NextRequest) {
  return proxyGet(request, "/platform-admin/billing/overview");
}
