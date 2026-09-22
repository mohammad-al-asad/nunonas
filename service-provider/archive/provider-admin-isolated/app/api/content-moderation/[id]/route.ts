import { NextRequest } from "next/server";
import { proxyGet, proxyPatch } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyGet(request, `/platform-admin/moderation/submissions/${id}`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyPatch(request, `/platform-admin/moderation/submissions/${id}/decision`);
}
