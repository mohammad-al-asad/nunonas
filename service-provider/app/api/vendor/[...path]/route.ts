import { NextRequest, NextResponse } from "next/server";
import { proxyDelete, proxyGet, proxyPatch, proxyPost } from "@/app/api/backend-proxy";

type RouteContext = { params: Promise<{ path: string[] }> };

async function backendPath(context: RouteContext) {
  const { path } = await context.params;
  return `/vendor/${path.map(encodeURIComponent).join("/")}`;
}

async function safeBackendPath(context: RouteContext) {
  const path = await backendPath(context);
  if (path === "/vendor/auth/login" || path === "/vendor/auth/refresh") {
    return null;
  }
  return path;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const path = await safeBackendPath(context); return path ? proxyGet(request, path) : NextResponse.json({ detail: "Use the portal authentication routes." }, { status: 404 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const path = await safeBackendPath(context); return path ? proxyPost(request, path) : NextResponse.json({ detail: "Use the portal authentication routes." }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const path = await safeBackendPath(context); return path ? proxyPatch(request, path) : NextResponse.json({ detail: "Unsupported vendor route." }, { status: 404 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const path = await safeBackendPath(context); return path ? proxyDelete(request, path) : NextResponse.json({ detail: "Unsupported vendor route." }, { status: 404 });
}
