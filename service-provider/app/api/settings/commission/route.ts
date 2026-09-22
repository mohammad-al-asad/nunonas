import { NextRequest } from "next/server";
import { proxyGet } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return proxyGet(request, "/vendor/settings/commission");
}
