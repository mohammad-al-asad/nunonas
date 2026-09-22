import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";

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

type LegalDocPayload = {
  title?: string;
  content?: string;
  last_updated?: string;
  content_by_audience?: Partial<Record<AudienceKey, string>>;
  detail?: string;
};

async function loadLegalContent(request: Request | NextRequest) {
  const headers = forwardHeaders(request);
  const [termsResponse, privacyResponse] = await Promise.all([
    fetch(backendUrl("/vendor/settings/legal/terms"), {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }),
    fetch(backendUrl("/vendor/settings/legal/privacy"), {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }),
  ]);

  const [termsPayload, privacyPayload] = (await Promise.all([
    termsResponse.json().catch(() => ({})),
    privacyResponse.json().catch(() => ({})),
  ])) as [LegalDocPayload, LegalDocPayload];

  if (!termsResponse.ok || !privacyResponse.ok) {
    const detail =
      termsPayload.detail ||
      privacyPayload.detail ||
      "Failed to read legal content data";
    return NextResponse.json(
      { detail },
      { status: termsResponse.ok ? privacyResponse.status : termsResponse.status },
    );
  }

  const payload: LegalContentData = {
    title: "Legal Content Editor",
    lastUpdated: String(
      termsPayload.last_updated || privacyPayload.last_updated || "",
    ),
    documents: {
      terms: String(termsPayload.title || "Terms of Service"),
      privacy: String(privacyPayload.title || "Privacy Policy"),
    },
    audiences: {
      apps: "Apps",
      business: "Business",
    },
    content: {
      terms: {
        apps: String(termsPayload.content_by_audience?.apps || ""),
        business: String(termsPayload.content_by_audience?.business || termsPayload.content || ""),
      },
      privacy: {
        apps: String(privacyPayload.content_by_audience?.apps || ""),
        business: String(privacyPayload.content_by_audience?.business || privacyPayload.content || ""),
      },
    },
  };

  return NextResponse.json(payload, { status: 200 });
}

export async function GET(request: NextRequest) {
  try {
    return await loadLegalContent(request);
  } catch {
    return NextResponse.json(
      {
        detail: "Failed to read legal content data",
      },
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

    const response = await fetch(backendUrl(`/vendor/settings/legal/${payload.document}`), {
      method: "PATCH",
      headers: forwardHeaders(request),
      body: JSON.stringify({
        content: payload.content,
        audience: payload.audience,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const updatedDoc = (await response.json().catch(() => ({}))) as LegalDocPayload;

    if (!response.ok) {
      return NextResponse.json(updatedDoc, { status: response.status });
    }

    return loadLegalContent(request);
  } catch {
    return NextResponse.json(
      { detail: "Failed to update legal content" },
      { status: 502 },
    );
  }
}
