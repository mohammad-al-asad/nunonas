import { NextRequest } from "next/server";
import { proxyPost } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await context.params;
  return proxyPost(request, `/platform-admin/support/tickets/${encodeURIComponent(ticketId)}/messages`);
}
