import { NextRequest } from "next/server";
import { proxyGet } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet(request, `/platform-admin/offers/${encodeURIComponent(id)}`);
}
