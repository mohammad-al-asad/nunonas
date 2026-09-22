import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function fallbackAvatar(seed: string) {
  return `https://i.pravatar.cc/120?u=${encodeURIComponent(seed)}`;
}

function mapTicket(input: unknown) {
  const record = asRecord(input);
  const conversation = Array.isArray(record.conversation) ? record.conversation : [];
  return {
    id: asString(record.id),
    userName: asString(record.user_name, "Unknown User"),
    userRole: "User" as const,
    avatar: asString(record.avatar, fallbackAvatar(asString(record.id) || asString(record.user_name, "support-user"))),
    type: (asString(record.type, "Account") as "Account" | "Technical" | "Billing" | "Compliance"),
    subject: asString(record.subject),
    status: (asString(record.status, "Open") as "In Progress" | "Open" | "Resolved"),
    priority: (asString(record.priority, "Medium") as "High" | "Medium" | "Low"),
    openedAt: asString(record.opened_at),
    issueDetails: asString(record.issue_details),
    conversation: conversation.map((item) => {
      const row = asRecord(item);
      return {
        sender: asString(row.sender, "user") as "agent" | "user",
        text: asString(row.text),
        time: asString(row.time),
        name: asString(row.name),
      };
    }),
  };
}

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = resolveAuthHeader(request);
  if (auth) headers.Authorization = auth;

  const url = new URL(backendUrl("/platform-admin/support/tickets"));
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), { method: "GET", headers, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as {
    summary_cards?: unknown[];
    tickets?: unknown[];
  };
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  return NextResponse.json({
    summaryCards: Array.isArray(payload.summary_cards) ? payload.summary_cards : [],
    tickets: Array.isArray(payload.tickets) ? payload.tickets.map(mapTicket) : [],
  });
}
