import { apiGetAuth, apiPostAuth } from "./auth-api";
import type {
  CustomerMapEventPayload,
  CustomerMapEventsResponse,
  EventBookingResponse,
} from "./event-map-types";

const V1 = "/api/v1";
const CUSTOMER_BASE = `${V1}/customer`;

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!entries.length) {
    return "";
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, String(value));
  }

  return `?${searchParams.toString()}`;
}

export async function getMapEvents(limit = 50): Promise<CustomerMapEventsResponse> {
  return apiGetAuth(`${CUSTOMER_BASE}/map/events${buildQuery({ limit })}`) as Promise<CustomerMapEventsResponse>;
}

export async function getMapHappyHours(limit = 50): Promise<CustomerMapEventsResponse> {
  return apiGetAuth(`${CUSTOMER_BASE}/map/happy-hours${buildQuery({ limit })}`) as Promise<CustomerMapEventsResponse>;
}

export async function getEvent(eventId: string): Promise<CustomerMapEventPayload> {
  return apiGetAuth(`${CUSTOMER_BASE}/events/${eventId}`) as Promise<CustomerMapEventPayload>;
}

export async function bookEventTickets(
  eventId: string,
  payload: { quantity: number; auto_confirm: boolean; promo_code?: string },
): Promise<EventBookingResponse> {
  return apiPostAuth(`${CUSTOMER_BASE}/events/${eventId}/bookings`, payload) as Promise<EventBookingResponse>;
}
