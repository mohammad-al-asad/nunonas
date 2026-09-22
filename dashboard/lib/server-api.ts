import { headers } from "next/headers";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function firstHeaderValue(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

async function resolveBaseUrl() {
  const headerList = await headers();
  const forwardedHost = firstHeaderValue(headerList.get("x-forwarded-host"));
  const host = forwardedHost ?? firstHeaderValue(headerList.get("host"));
  const forwardedProto = firstHeaderValue(headerList.get("x-forwarded-proto"));
  const protocol = forwardedProto ?? (process.env.NODE_ENV === "development" ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return trimTrailingSlash(process.env.RENDER_EXTERNAL_URL);
  }

  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

export async function fetchApiData<T extends object>(path: string, fallback: T): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const baseUrl = await resolveBaseUrl();
    const requestHeaders = await headers();
    const forwardedHeaders: Record<string, string> = {};
    const authorization = requestHeaders.get("authorization");
    const cookie = requestHeaders.get("cookie");
    if (authorization) forwardedHeaders.authorization = authorization;
    if (cookie) forwardedHeaders.cookie = cookie;
    const response = await fetch(`${baseUrl}${normalizedPath}`, {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: forwardedHeaders,
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      return fallback;
    }

    const raw = (await response.json()) as Record<string, unknown>;

    // Merge with fallback so any missing key from a stub/partial response is filled.
    // Only spread the response if it shares at least one key with the fallback.
    const fallbackKeys = Object.keys(fallback as object);
    const responseKeys = Object.keys(raw ?? {});
    const hasMatchingKey = fallbackKeys.some((k) => responseKeys.includes(k));

    if (!hasMatchingKey) {
      // The response is completely different shape (e.g. a stub) — use fallback
      return fallback;
    }

    return { ...fallback, ...raw } as T;
  } catch {
    return fallback;
  }
}
