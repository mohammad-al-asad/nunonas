import { NextResponse } from "next/server";

const METRIC_NAMES = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !METRIC_NAMES.has(String(body.name)) || !Number.isFinite(Number(body.value))) {
    // Web-vitals callbacks can include browser-specific/partial metrics. They
    // should never surface as an application error or pollute the console.
    return new NextResponse(null, { status: 204 });
  }
  return new NextResponse(null, { status: 204 });
}
