import { NextRequest } from "next/server";
import { proxyGet, proxyPatch } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return proxyGet(request, "/vendor/settings/profile");
}

export async function PATCH(request: NextRequest) {
  return proxyPatch(request, "/vendor/settings/profile");
}
