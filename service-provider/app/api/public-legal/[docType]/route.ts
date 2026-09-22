import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/app/api/backend-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDocType(value: string): "terms" | "privacy" | null {
  return value === "privacy" || value === "terms" ? value : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ docType: string }> },
) {
  const { docType: rawDocType } = await context.params;
  const docType = normalizeDocType(String(rawDocType || "").trim().toLowerCase());

  if (!docType) {
    return NextResponse.json({ detail: "Legal document not found." }, { status: 404 });
  }

  try {
    const response = await fetch(backendUrl(`/vendor/legal/${docType}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to load legal document." },
      { status: 502 },
    );
  }
}
