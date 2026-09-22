import { NextRequest } from "next/server";
import { proxyPatch } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await context.params;
  return proxyPatch(request, `/platform-admin/support/tickets/${encodeURIComponent(ticketId)}/status`);
}
