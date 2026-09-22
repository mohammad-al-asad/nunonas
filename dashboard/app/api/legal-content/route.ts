import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DocumentKey = "terms" | "privacy";
type AudienceKey = "apps" | "business";

type LegalContentData = {
  title: string;
  lastUpdated: string;
  documents: Record<DocumentKey, string>;
  audiences: Record<AudienceKey, string>;
  content: Record<DocumentKey, Record<AudienceKey, string>>;
};

type UpdatePayload = {
  document?: DocumentKey;
  audience?: AudienceKey;
  content?: string;
};

function isDocumentKey(value: string | undefined): value is DocumentKey {
  return value === "terms" || value === "privacy";
}

function isAudienceKey(value: string | undefined): value is AudienceKey {
  return value === "apps" || value === "business";
}

function forwardHeaders(request?: Request | NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (request) {
    const auth = resolveAuthHeader(request);
    if (auth) {
      headers.Authorization = auth;
    }
  }
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch(backendUrl("/platform-admin/settings/legal-content"), {
      method: "GET",
      headers: forwardHeaders(request),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as LegalContentData | { detail?: string };
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as UpdatePayload;

    if (!isDocumentKey(payload.document) || !isAudienceKey(payload.audience) || typeof payload.content !== "string") {
      return NextResponse.json({ detail: "Invalid legal content payload" }, { status: 400 });
    }

    const response = await backendFetch(backendUrl("/platform-admin/settings/legal-content"), {
      method: "PATCH",
      headers: forwardHeaders(request),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const nextLegalContent = (await response.json().catch(() => ({}))) as LegalContentData | { detail?: string };
    return NextResponse.json(nextLegalContent, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "The backend did not respond in time." },
      { status: 502 },
    );
  }
}
