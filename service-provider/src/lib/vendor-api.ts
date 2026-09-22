/**
 * api.ts — Extended vendor API client for the service provider portal.
 * Covers all vendor blueprint endpoints.
 */

import {
  cacheVendorCategories,
  clearCachedVendorCategories,
} from "@/lib/vendor-access";
import { formatApiError } from "@/lib/api-error";
import type { EventDiscoveryCategory } from "@/lib/event-categories";

const RAW_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || "").replace(/\/+$/, "");
const V = RAW_API_BASE_URL ? (RAW_API_BASE_URL.endsWith("/api/v1") ? RAW_API_BASE_URL : `${RAW_API_BASE_URL}/api/v1`) : "/api/v1";
let profileSettingsCache: { value: Record<string, unknown>; expiresAt: number } | null = null;
let profileSettingsRequest: Promise<Record<string, unknown>> | null = null;
let profileSettingsRevision = 0;

// ─── Token management ─────────────────────────────────────────────────────────

export function clearVendorTokens(): void {
  clearCachedVendorCategories();
}

// ─── Base request ─────────────────────────────────────────────────────────────

function vendorProxyPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.startsWith("/vendor/")
    ? `/api/vendor${normalized.slice("/vendor".length)}`
    : `/api/vendor${normalized}`;
}

export async function vendorRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, unknown>,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? (method === "GET" ? 15_000 : 30_000));

  let response: Response;
  try {
    response = await fetch(vendorProxyPath(path), {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new Error("The server took too long to respond. Please try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }

  const result = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    if (response.status === 401) {
      clearVendorTokens();
      if (typeof window !== "undefined") {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
      }
    }
    const error = new Error(formatApiError(result, response.status));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return result;
}

export async function vendorPublicRequest<T>(path: string): Promise<T> {
  const response = await fetch(path.startsWith("/api/") ? path : `${V}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const result = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new Error(formatApiError(result, response.status));
  }

  return result;
}

function q(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (!entries.length) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type VendorEventStatus = "draft" | "published" | "archived" | "cancelled";

export interface VendorEventPayload {
  title: string;
  event_type: EventDiscoveryCategory;
  event_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  venue: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  ticket_price: number;
  registration_deadline?: string | null;
  description: string;
  banner_image_url?: string | null;
  active_status: boolean;
  status: VendorEventStatus;
}

export type VendorHappyHourStatus = VendorEventStatus;

export interface VendorHappyHourPayload {
  title: string;
  venue_type: "restaurant" | "hotel" | "spa" | "other";
  offer_text: string;
  start_date: string;
  end_date: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  timezone: string;
  venue: string;
  latitude?: number | null;
  longitude?: number | null;
  original_price?: number | null;
  happy_hour_price?: number | null;
  discount_percent?: number | null;
  description: string;
  terms_and_conditions: string;
  banner_image_url?: string | null;
  active_status: boolean;
  status: VendorHappyHourStatus;
}

/** POST /vendor/auth/register/request-code */
export async function vendorRequestRegisterCode(payload: {
  email_or_phone: string;
}) {
  return vendorRequest(`/vendor/auth/register/request-code`, "POST", payload);
}

/** POST /vendor/auth/register/verify-code */
export async function vendorVerifyRegisterCode(payload: {
  email_or_phone: string;
  validation_code: string;
}) {
  return vendorRequest(`/vendor/auth/register/verify-code`, "POST", payload);
}

/** POST /vendor/auth/register */
export async function vendorRegister(payload: Record<string, unknown>) {
  return vendorRequest(`/vendor/auth/register`, "POST", payload);
}

/** GET /vendor/auth/registration-status */
export async function vendorGetRegistrationStatus() {
  return vendorRequest(`/vendor/auth/registration-status`);
}

/** GET /vendor/legal/:doc_type */
export async function vendorGetPublicLegalDoc(docType: "terms" | "privacy") {
  return vendorPublicRequest<Record<string, unknown>>(`/api/public-legal/${docType}`);
}

/** POST /vendor/auth/forgot-password/request */
export async function vendorForgotPasswordRequest(payload: {
  email_or_phone: string;
}) {
  return vendorRequest(`/vendor/auth/forgot-password/request`, "POST", payload);
}

/** POST /vendor/auth/forgot-password/verify-code */
export async function vendorForgotPasswordVerifyCode(payload: {
  email_or_phone: string;
  validation_code: string;
}) {
  return vendorRequest(
    `/vendor/auth/forgot-password/verify-code`,
    "POST",
    payload,
  );
}

/** POST /vendor/auth/forgot-password/reset */
export async function vendorResetPassword(payload: {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}) {
  return vendorRequest(`/vendor/auth/forgot-password/reset`, "POST", payload);
}

/** POST /vendor/auth/kyc/submit */
export async function vendorSubmitKyc(payload: Record<string, unknown>) {
  return vendorRequest(`/vendor/auth/kyc/submit`, "POST", payload);
}

/** GET /vendor/auth/kyc/status */
export async function vendorGetKycStatus() {
  return vendorRequest(`/vendor/auth/kyc/status`);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

/** GET /vendor/dashboard/overview */
export async function vendorListEvents(
  params: {
    search?: string;
    status?: string;
  } = {},
  signal?: AbortSignal,
) {
  return vendorRequest<Record<string, unknown>>(`/vendor/events${q(params)}`, "GET", undefined, { signal });
}

export async function vendorCreateEvent(payload: VendorEventPayload) {
  return vendorRequest<Record<string, unknown>>(`/vendor/events`, "POST", payload as unknown as Record<string, unknown>);
}

export async function vendorGetEvent(eventId: string) {
  return vendorRequest<Record<string, unknown>>(`/vendor/events/${eventId}`);
}

export async function vendorUpdateEvent(eventId: string, payload: VendorEventPayload) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/events/${eventId}`,
    "PATCH",
    payload as unknown as Record<string, unknown>,
  );
}

export async function vendorUpdateEventStatus(eventId: string, status: VendorEventStatus) {
  return vendorRequest<Record<string, unknown>>(`/vendor/events/${eventId}/status`, "PATCH", { status });
}

export async function vendorDeleteEvent(eventId: string) {
  return vendorRequest<Record<string, unknown>>(`/vendor/events/${eventId}`, "DELETE");
}

export async function vendorListHappyHours(
  params: { search?: string; status?: string } = {},
  signal?: AbortSignal,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/happy-hours${q(params)}`,
    "GET",
    undefined,
    { signal },
  );
}

export async function vendorCreateHappyHour(payload: VendorHappyHourPayload) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/happy-hours`,
    "POST",
    payload as unknown as Record<string, unknown>,
  );
}

export async function vendorGetHappyHour(happyHourId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/happy-hours/${happyHourId}`,
  );
}

export async function vendorUpdateHappyHour(
  happyHourId: string,
  payload: VendorHappyHourPayload,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/happy-hours/${happyHourId}`,
    "PATCH",
    payload as unknown as Record<string, unknown>,
  );
}

export async function vendorUpdateHappyHourStatus(
  happyHourId: string,
  status: VendorHappyHourStatus,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/happy-hours/${happyHourId}/status`,
    "PATCH",
    { status },
  );
}

export async function vendorDeleteHappyHour(happyHourId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/happy-hours/${happyHourId}`,
    "DELETE",
  );
}

// ─── Booking Management ────────────────────────────────────────────────────────

/** GET /vendor/booking-management/bookings */
export async function vendorListBookings(
  params: {
    limit?: number;
    skip?: number;
    search?: string;
    status?: string;
    provider_type?: string;
    event_id?: string;
    date_from?: string;
    date_to?: string;
  } = {},
  signal?: AbortSignal,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/booking-management/bookings${q(params)}`,
    "GET",
    undefined,
    { signal },
  );
}

/** GET /vendor/booking-management/bookings/:id */
export async function vendorGetBooking(bookingId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/booking-management/bookings/${bookingId}`,
  );
}

/** PATCH /vendor/booking-management/bookings/:id/status */
export async function vendorUpdateBookingStatus(
  bookingId: string,
  status: string,
  note?: string,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/booking-management/bookings/${bookingId}/status`,
    "PATCH",
    { status, note },
  );
}

/** PATCH /vendor/booking-management/bookings/:id/reschedule */
export async function vendorRescheduleBooking(
  bookingId: string,
  payload: { date: string; time: string; note?: string },
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/booking-management/bookings/${bookingId}/reschedule`,
    "PATCH",
    payload,
  );
}

/** POST /vendor/booking-management/bookings/:id/receipt */
export async function vendorGenerateReceipt(bookingId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/booking-management/bookings/${bookingId}/receipt`,
    "POST",
    {},
  );
}

// ─── Menu / Gallery Assets ─────────────────────────────────────────────────────

/** GET /vendor/menu-services/assets */
export async function vendorListAssets(
  assetType?: string,
  serviceType?: "restaurant" | "hotel" | "spa",
) {
  return vendorRequest<{ items: Record<string, unknown>[] }>(
    `/vendor/menu-services/assets${q({
      asset_type: assetType,
      service_type: serviceType,
    })}`,
  );
}

/** GET /vendor/menu-services/overview */
export async function vendorGetMenuServicesOverview(
  serviceType: "restaurant" | "hotel" | "spa" = "restaurant",
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/menu-services/overview${q({ service_type: serviceType })}`,
  );
}

/** DELETE /vendor/menu-services/assets/:id */
export async function vendorDeleteAsset(assetId: string) {
  return vendorRequest(`/vendor/menu-services/assets/${assetId}`, "DELETE");
}

// ─── Rooms / Services ──────────────────────────────────────────────────────────

/** GET /vendor/rooms-services/rooms */
export async function vendorListRooms() {
  return vendorRequest<{ items: Record<string, unknown>[] }>(
    `/vendor/rooms-services/rooms`,
  );
}

/** POST /vendor/rooms-services/rooms */
export async function vendorCreateRoom(payload: Record<string, unknown>) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/rooms`,
    "POST",
    payload,
  );
}

/** GET /vendor/rooms-services/rooms/:id */
export async function vendorGetRoom(roomId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/rooms/${roomId}`,
  );
}

/** PATCH /vendor/rooms-services/rooms/:id */
export async function vendorUpdateRoom(
  roomId: string,
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/rooms/${roomId}`,
    "PATCH",
    payload,
  );
}

/** PATCH /vendor/rooms-services/rooms/:id/availability */
export async function vendorUpdateRoomAvailability(
  roomId: string,
  available: boolean,
  maintenanceNote?: string,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/rooms/${roomId}/availability`,
    "PATCH",
    { available, maintenance_note: maintenanceNote },
  );
}

/** DELETE /vendor/rooms-services/rooms/:id */
export async function vendorDeleteRoom(roomId: string) {
  return vendorRequest(`/vendor/rooms-services/rooms/${roomId}`, "DELETE");
}

// ─── Room Services ───────────────────────────────────────────────────────────

/** GET /vendor/rooms-services/services */
export async function vendorListServices(
  serviceType?: "restaurant" | "hotel" | "spa",
) {
  return vendorRequest<{ items: Record<string, unknown>[] }>(
    `/vendor/rooms-services/services${q({ service_type: serviceType })}`,
  );
}

/** POST /vendor/rooms-services/services */
export async function vendorCreateService(payload: Record<string, unknown>) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/services`,
    "POST",
    payload,
  );
}

/** GET /vendor/rooms-services/services/:id */
export async function vendorGetService(serviceId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/services/${serviceId}`,
  );
}

/** PATCH /vendor/rooms-services/services/:id */
export async function vendorUpdateService(
  serviceId: string,
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/services/${serviceId}`,
    "PATCH",
    payload,
  );
}

/** PATCH /vendor/rooms-services/services/:id/status */
export async function vendorUpdateServiceStatus(
  serviceId: string,
  active: boolean,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/rooms-services/services/${serviceId}/status?active=${active}`,
    "PATCH",
    {},
  );
}

/** DELETE /vendor/rooms-services/services/:id */
export async function vendorDeleteService(serviceId: string) {
  return vendorRequest(`/vendor/rooms-services/services/${serviceId}`, "DELETE");
}

// ─── Promotions ────────────────────────────────────────────────────────────────

/** GET /vendor/promotions */
export async function vendorListPromotions(params: {
  search?: string;
  active?: boolean;
} = {}, signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions${q(params)}`,
    "GET",
    undefined,
    { signal },
  );
}

/** POST /vendor/promotions */
export async function vendorCreatePromotion(payload: Record<string, unknown>) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions`,
    "POST",
    payload,
  );
}

/** GET /vendor/promotions/:id */
export async function vendorGetPromotion(promotionId: string, signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions/${promotionId}`,
    "GET",
    undefined,
    { signal },
  );
}

/** PATCH /vendor/promotions/:id */
export async function vendorUpdatePromotion(
  promotionId: string,
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions/${promotionId}`,
    "PATCH",
    payload,
  );
}

/** PATCH /vendor/promotions/:id/status */
export async function vendorUpdatePromotionStatus(
  promotionId: string,
  active: boolean,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions/${promotionId}/status`,
    "PATCH",
    { active },
  );
}

/** DELETE /vendor/promotions/:id */
export async function vendorDeletePromotion(promotionId: string) {
  return vendorRequest(`/vendor/promotions/${promotionId}`, "DELETE");
}

/** PATCH /vendor/promotions/platform-campaigns/:id/join */
export async function vendorJoinPlatformCampaign(
  campaignId: string,
  join: boolean,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions/platform-campaigns/${campaignId}/join`,
    "PATCH",
    { join },
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/** GET /vendor/analytics/overview */
export async function vendorGetAnalyticsOverview(
  params: { date_from?: string; date_to?: string } = {},
  signal?: AbortSignal,
) {
  return vendorRequest<Record<string, unknown>>(`/vendor/analytics/overview${q(params)}`, "GET", undefined, { signal });
}

/** GET /vendor/analytics/demographics */
export async function vendorGetDemographics() {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/analytics/demographics`,
  );
}

/** GET /vendor/analytics/occupancy */
export async function vendorGetOccupancy() {
  return vendorRequest<Record<string, unknown>>(`/vendor/analytics/occupancy`);
}

/** GET /vendor/analytics/reviews-summary */
export async function vendorGetReviewsSummary() {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/analytics/reviews-summary`,
  );
}

/** GET /vendor/analytics/export */
export async function vendorExportAnalytics(params: { date_from?: string; date_to?: string } = {}) {
  return vendorRequest<{ filename?: string; content_type?: string; content?: string; download_url?: string }>(
    `/vendor/analytics/export${q(params)}`,
  );
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────

/** GET /vendor/loyalty/settings */
export async function vendorGetLoyaltySettings(signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(`/vendor/loyalty/settings`, "GET", undefined, { signal });
}

/** PATCH /vendor/loyalty/settings */
export async function vendorUpdateLoyaltySettings(
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/loyalty/settings`,
    "PATCH",
    payload,
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/** GET /vendor/reviews */
export async function vendorListReviews(
  params: {
    limit?: number;
    skip?: number;
    search?: string;
    star_rating?: number;
    replied?: boolean;
    provider_type?: "restaurant" | "hotel" | "spa" | "event";
  } = {},
  signal?: AbortSignal,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/reviews${q(params)}`,
    "GET",
    undefined,
    { signal },
  );
}

/** POST /vendor/reviews/:id/reply */
export async function vendorReplyReview(
  reviewId: string,
  replyText: string,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/reviews/${reviewId}/reply`,
    "POST",
    { reply_text: replyText },
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/** GET /vendor/settings */
export async function vendorGetSettings() {
  return vendorRequest<Record<string, unknown>>(`/vendor/settings`);
}

/** GET /vendor/settings/general */
export async function vendorGetGeneralSettings() {
  return vendorRequest<Record<string, unknown>>(`/vendor/settings/general`);
}

/** PATCH /vendor/settings/general */
export async function vendorUpdateGeneralSettings(
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/general`,
    "PATCH",
    payload,
  );
}

/** GET /vendor/settings/legal/:doc_type */
export async function vendorGetLegalDoc(docType: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/legal/${docType}`,
  );
}

/** PATCH /vendor/settings/legal/:doc_type */
export async function vendorUpdateLegalDoc(
  docType: string,
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/legal/${docType}`,
    "PATCH",
    payload,
  );
}

/** GET /vendor/settings/profile */
export async function vendorGetProfileSettings(signal?: AbortSignal) {
  const now = Date.now();
  if (profileSettingsCache && profileSettingsCache.expiresAt > now) {
    return profileSettingsCache.value;
  }
  if (profileSettingsRequest) {
    return profileSettingsRequest;
  }

  // Several dashboard components need the same profile. Share one in-flight
  // request and briefly cache the result to avoid a request per component or
  // React Strict Mode mount.
  const requestRevision = profileSettingsRevision;
  const request = vendorRequest<Record<string, unknown>>(`/vendor/settings/profile`, "GET", undefined, { signal })
    .then((result) => {
      if (requestRevision === profileSettingsRevision) {
        profileSettingsCache = { value: result, expiresAt: Date.now() + 30_000 };
        cacheVendorCategories(result.categories ?? result.category);
      }
      return result;
    })
    .finally(() => {
      if (profileSettingsRequest === request) {
        profileSettingsRequest = null;
      }
    });
  profileSettingsRequest = request;
  return profileSettingsRequest;
}

/** PATCH /vendor/settings/profile */
export async function vendorUpdateProfileSettings(
  payload: Record<string, unknown>,
) {
  const result = await vendorRequest<Record<string, unknown>>(
    `/vendor/settings/profile`,
    "PATCH",
    payload,
  );
  cacheVendorCategories(
    result.categories ?? payload.categories ?? result.category ?? payload.category,
  );
  profileSettingsRevision += 1;
  profileSettingsRequest = null;
  profileSettingsCache = { value: result, expiresAt: Date.now() + 30_000 };
  return result;
}

/** GET /vendor/settings/services/:service_type */
export async function vendorGetServiceSettings(
  serviceType: "restaurant" | "hotel" | "spa" | "event" | "happy_hour",
  signal?: AbortSignal,
) {
  return vendorRequest<{
    service_type: string;
    settings: Record<string, unknown>;
  }>(`/vendor/settings/services/${serviceType}`, "GET", undefined, { signal });
}

/** PATCH /vendor/settings/services/:service_type */
export async function vendorUpdateServiceSettings(
  serviceType: "restaurant" | "hotel" | "spa" | "event" | "happy_hour",
  payload: Record<string, unknown>,
) {
  const result = await vendorRequest<{
    service_type: string;
    settings: Record<string, unknown>;
    listing: Record<string, unknown>;
  }>(`/vendor/settings/services/${serviceType}`, "PATCH", payload);
  profileSettingsCache = null;
  return result;
}

/** POST /vendor/settings/services/:service_type/amenities */
export async function vendorAddServiceAmenity(
  serviceType: "restaurant" | "hotel" | "spa" | "event" | "happy_hour",
  name: string,
) {
  const result = await vendorRequest<{
    service_type: "restaurant" | "hotel" | "spa" | "event" | "happy_hour";
    amenity: string;
    created: boolean;
    amenities: string[];
  }>(`/vendor/settings/services/${serviceType}/amenities`, "POST", { name });
  profileSettingsCache = null;
  return result;
}

/** PATCH /vendor/settings/password */
export async function vendorUpdatePassword(payload: {
  old_password: string;
  new_password: string;
  confirm_password?: string;
}) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/password`,
    "PATCH",
    {
      ...payload,
      confirm_password: payload.confirm_password ?? payload.new_password,
    },
  );
}

/** GET /vendor/settings/commission */
export async function vendorGetCommissionSettings() {
  return vendorRequest<Record<string, unknown>>(`/vendor/settings/commission`);
}

// ─── Support ─────────────────────────────────────────────────────────────────

/** GET /vendor/support/tickets */
export async function vendorListSupportTickets(
  params: { limit?: number; skip?: number } = {},
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/support/tickets${q(params)}`,
  );
}

/** POST /vendor/support/tickets */
export async function vendorCreateSupportTicket(
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/support/tickets`,
    "POST",
    payload,
  );
}

/** GET /vendor/support/tickets/:id */
export async function vendorGetSupportTicket(ticketId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/support/tickets/${ticketId}`,
  );
}

/** POST /vendor/support/tickets/:id/messages */
export async function vendorReplySupportTicket(
  ticketId: string,
  message: string,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/support/tickets/${ticketId}/messages`,
    "POST",
    { message, metadata: {} },
  );
}

// ─── Users (vendor portal users list) ────────────────────────────────────────

/** GET /vendor/users */
export async function vendorListUsers(
  params: { limit?: number; skip?: number; search?: string } = {},
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/users${q(params)}`,
  );
}

/** GET /vendor/users/:id */
export async function vendorGetUser(userId: string, signal?: AbortSignal) {
  return vendorRequest<Record<string, unknown>>(`/vendor/users/${userId}`, "GET", undefined, { signal });
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** GET /vendor/notifications */
export async function vendorListNotifications(
  params: { limit?: number; skip?: number } = {},
  signal?: AbortSignal,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/notifications${q(params)}`,
    "GET",
    undefined,
    { signal },
  );
}

/** POST /vendor/notifications/:id/action */
export async function vendorMarkNotificationRead(notificationId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/notifications/${notificationId}/action`,
    "POST",
    { action: "mark_read" },
  );
}

/** DELETE /vendor/notifications/clear */
export async function vendorClearNotifications() {
  return vendorRequest<Record<string, unknown>>(`/vendor/notifications/clear`, "DELETE");
}

/** PATCH /vendor/notifications/settings */
export async function vendorUpdateNotificationSettings(
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/notifications/settings`,
    "PATCH",
    payload,
  );
}

/** GET /vendor/notifications/settings */
export async function vendorGetNotificationSettings() {
  return vendorRequest<Record<string, unknown>>(`/vendor/notifications/settings`);
}

// ─── File Upload ──────────────────────────────────────────────────────────────

/**
 * Upload a file (image/document) to the vendor backend.
 * Returns the URL of the uploaded file.
 */
export async function uploadVendorFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/vendor/uploads/image", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  const result = (await response.json().catch(() => ({}))) as {
    url?: string;
    file_url?: string;
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.detail ?? result.message ?? `Upload failed (${response.status})`);
  }

  return result.url ?? result.file_url ?? "";
}

export async function uploadVendorProfileAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/settings/profile/avatar", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    avatar_url?: string;
    profile_image_url?: string;
    detail?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "Failed to upload profile image.");
  }
  const avatarUrl = String(payload.avatar_url || payload.profile_image_url || "");
  profileSettingsRevision += 1;
  profileSettingsRequest = null;
  profileSettingsCache = profileSettingsCache
    ? {
        value: { ...profileSettingsCache.value, avatar_url: avatarUrl },
        expiresAt: Date.now() + 30_000,
      }
    : null;
  return avatarUrl;
}

export async function deleteVendorProfileAvatar(): Promise<void> {
  const response = await fetch("/api/settings/profile/avatar", { method: "DELETE" });
  const payload = (await response.json().catch(() => ({}))) as {
    detail?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "Failed to remove profile image.");
  }
  profileSettingsRevision += 1;
  profileSettingsRequest = null;
  profileSettingsCache = profileSettingsCache
    ? { value: { ...profileSettingsCache.value, avatar_url: "" }, expiresAt: Date.now() + 30_000 }
    : null;
}

// ─── Generic JSON Helper ──────────────────────────────────────────────────────

/**
 * Generic raw vendor request for pages that need direct path control.
 * @example vendorJson("/vendor/settings/profile", "PATCH", {...})
 */
export async function vendorJson<T = Record<string, unknown>>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, unknown>,
): Promise<T> {
  return vendorRequest<T>(path, method, body);
}
