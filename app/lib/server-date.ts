// The API stores times in UTC but sends them without a timezone ("2026-11-12T04:56:50"), and
// `new Date()` reads such strings as local time, showing them hours off. Treat them as UTC.
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/i;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function parseServerDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  const normalized = ISO_DATE_TIME.test(text) && !HAS_TIMEZONE.test(text) ? `${text}Z` : text;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
