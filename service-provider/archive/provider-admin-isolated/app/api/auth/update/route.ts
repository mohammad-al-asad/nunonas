import { jsonError } from "@/app/api/_data";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UpdatePasswordPayload = {
  email: string;
  currentPassword: string;
  newPassword: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as UpdatePasswordPayload;
    if (!payload?.email || !payload?.currentPassword || !payload?.newPassword) {
      return jsonError("Invalid password payload");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    const auth = resolveAuthHeader(request);
    if (auth) headers.Authorization = auth;

    const response = await fetch(backendUrl("/platform-admin/settings/password"), {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
        confirmPassword: payload.newPassword
      })
    });

    const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(result, { status: response.status });
  } catch {
    return jsonError("Failed to update password");
  }
}
