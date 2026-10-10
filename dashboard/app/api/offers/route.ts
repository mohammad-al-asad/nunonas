import { NextRequest } from "next/server";
import { proxyGet, proxyPost } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return proxyGet(request, "/platform-admin/offers");
}

export async function POST(request: NextRequest) {
  return proxyPost(request, "/platform-admin/offers");
}
