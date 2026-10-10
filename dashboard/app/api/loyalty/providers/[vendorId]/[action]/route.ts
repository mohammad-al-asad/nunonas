import { NextRequest, NextResponse } from "next/server";
import { proxyPost } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// action: "approve" | "reject" (reject body: { reason?: string })
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; action: string }> },
) {
  const { vendorId, action } = await params;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ detail: "Unknown action." }, { status: 404 });
  }
  return proxyPost(request, `/platform-admin/loyalty/providers/${encodeURIComponent(vendorId)}/${action}`);
}
