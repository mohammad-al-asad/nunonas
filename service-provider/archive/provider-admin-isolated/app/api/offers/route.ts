import { NextRequest, NextResponse } from "next/server";
import { backendUrl, resolveAuthHeader } from "@/app/api/backend-proxy";
import { buildOfferSummaryCards, mapAdminOffer } from "@/lib/offers-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requestBackend(request: NextRequest, path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  const auth = resolveAuthHeader(request);
  if (auth) headers.Authorization = auth;

  return fetch(backendUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function fetchOffers(request: NextRequest) {
  const response = await requestBackend(request, "/platform-admin/offers", { method: "GET" });
  const payload = (await response.json().catch(() => ({}))) as { offers?: unknown[] };
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  const offers = (Array.isArray(payload.offers) ? payload.offers : []).map(mapAdminOffer);
  return NextResponse.json({
    summaryCards: buildOfferSummaryCards(offers),
    offers,
  });
}

export async function GET(request: NextRequest) {
  return fetchOffers(request);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const response = await requestBackend(request, "/platform-admin/offers", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return fetchOffers(request);
}

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ detail: "Offer id is required." }, { status: 400 });
  }
  const response = await requestBackend(request, `/platform-admin/offers/${encodeURIComponent(body.id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return fetchOffers(request);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: string; active?: boolean };
  if (!body.id || typeof body.active !== "boolean") {
    return NextResponse.json({ detail: "Offer id and active flag are required." }, { status: 400 });
  }
  const response = await requestBackend(request, `/platform-admin/offers/${encodeURIComponent(body.id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: body.active ? "active" : "inactive" }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return fetchOffers(request);
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ detail: "Offer id is required." }, { status: 400 });
  }
  const response = await requestBackend(request, `/platform-admin/offers/${encodeURIComponent(body.id)}`, {
    method: "DELETE",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return fetchOffers(request);
}
