/**
 * api.ts — Extended vendor API client for the service provider portal.
 * Covers all vendor blueprint endpoints.
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || "").replace(/\/+$/, "");
const V = API_BASE_URL ? (API_BASE_URL.endsWith("/api/v1") ? API_BASE_URL : `${API_BASE_URL}/api/v1`) : "/api/v1";

// ─── Token management ─────────────────────────────────────────────────────────

export function getVendorToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vendor_access_token");
}

function getVendorRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vendor_refresh_token");
}

export function saveVendorToken(token: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vendor_access_token", token);
  if (refreshToken) localStorage.setItem("vendor_refresh_token", refreshToken);
}

export function clearVendorTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vendor_access_token");
  localStorage.removeItem("vendor_refresh_token");
}

// ─── Base request ─────────────────────────────────────────────────────────────

function buildAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getVendorToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

let vendorRefreshPromise: Promise<string | null> | null = null;

async function refreshVendorAccessToken(): Promise<string | null> {
  const refreshToken = getVendorRefreshToken();
  if (!refreshToken) {
    return null;
  }
  if (vendorRefreshPromise) {
    return vendorRefreshPromise;
  }

  vendorRefreshPromise = (async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const result = (await response.json().catch(() => ({}))) as VendorAuthResult & {
      detail?: string;
      message?: string;
    };
    if (!response.ok || !result.access_token) {
      clearVendorTokens();
      return null;
    }
    saveVendorToken(result.access_token, result.refresh_token ?? result.session_token);
    return result.access_token;
  })();

  try {
    return await vendorRefreshPromise;
  } finally {
    vendorRefreshPromise = null;
  }
}

export async function vendorRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, unknown>,
  retryOnAuth = true,
): Promise<T> {
  const response = await fetch(`${V}${path}`, {
    method,
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = (await response.json().catch(() => ({}))) as T & {
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      if (retryOnAuth) {
        const refreshedToken = await refreshVendorAccessToken();
        if (refreshedToken) {
          return vendorRequest<T>(path, method, body, false);
        }
      }
      clearVendorTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    throw new Error(
      (result as { detail?: string }).detail ||
        (result as { message?: string }).message ||
        `Request failed (${response.status})`,
    );
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

export interface VendorAuthResult {
  access_token?: string;
  refresh_token?: string;
  session_token?: string;
  vendor?: Record<string, unknown>;
  [key: string]: unknown;
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

/** POST /vendor/auth/login */
export async function vendorLogin(payload: {
  email_or_phone: string;
  password: string;
}) {
  const result = await vendorRequest<VendorAuthResult>(
    `/vendor/auth/login`,
    "POST",
    payload,
  );
  if (result.access_token) {
    saveVendorToken(result.access_token, result.refresh_token ?? result.session_token);
  }
  return result;
}

/** POST /vendor/auth/refresh */
export async function vendorRefreshSession(refreshToken: string) {
  const result = await vendorRequest<VendorAuthResult>(
    `/vendor/auth/refresh`,
    "POST",
    { refresh_token: refreshToken },
    false,
  );
  if (result.access_token) {
    saveVendorToken(result.access_token, result.refresh_token ?? result.session_token);
  }
  return result;
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
export async function vendorGetDashboardOverview() {
  return vendorRequest<Record<string, unknown>>(`/vendor/dashboard/overview`);
}

/** GET /vendor/dashboard/booking-trends */
export async function vendorGetBookingTrends() {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/dashboard/booking-trends`,
  );
}

/** GET /vendor/dashboard/calendar-preview */
export async function vendorGetCalendarPreview() {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/dashboard/calendar-preview`,
  );
}

/** GET /vendor/dashboard/upcoming-bookings */
export async function vendorGetUpcomingBookings(limit = 10) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/dashboard/upcoming-bookings${q({ limit })}`,
  );
}

/** GET /vendor/dashboard/recent-reviews */
export async function vendorGetRecentReviews(limit = 5) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/dashboard/recent-reviews${q({ limit })}`,
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
    date_from?: string;
    date_to?: string;
  } = {},
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/booking-management/bookings${q(params)}`,
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
export async function vendorListAssets(assetType?: string) {
  return vendorRequest<{ items: Record<string, unknown>[] }>(
    `/vendor/menu-services/assets${q({ asset_type: assetType })}`,
  );
}

/** GET /vendor/menu-services/overview */
export async function vendorGetMenuServicesOverview() {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/menu-services/overview`,
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
export async function vendorListServices() {
  return vendorRequest<{ items: Record<string, unknown>[] }>(
    `/vendor/rooms-services/services`,
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
} = {}) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions${q(params)}`,
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
export async function vendorGetPromotion(promotionId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/promotions/${promotionId}`,
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
export async function vendorGetAnalyticsOverview() {
  return vendorRequest<Record<string, unknown>>(`/vendor/analytics/overview`);
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
export async function vendorExportAnalytics() {
  return vendorRequest<Record<string, unknown>>(`/vendor/analytics/export`);
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────

/** GET /vendor/loyalty/settings */
export async function vendorGetLoyaltySettings() {
  return vendorRequest<Record<string, unknown>>(`/vendor/loyalty/settings`);
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
  } = {},
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/reviews${q(params)}`,
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

/** PATCH /vendor/settings/commission */
export async function vendorUpdateCommissionSettings(
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/commission`,
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
export async function vendorGetProfileSettings() {
  return vendorRequest<Record<string, unknown>>(`/vendor/settings/profile`);
}

/** PATCH /vendor/settings/profile */
export async function vendorUpdateProfileSettings(
  payload: Record<string, unknown>,
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/profile`,
    "PATCH",
    payload,
  );
}

/** PATCH /vendor/settings/password */
export async function vendorUpdatePassword(payload: {
  old_password: string;
  new_password: string;
}) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/settings/password`,
    "PATCH",
    payload,
  );
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
  params: { limit?: number; skip?: number } = {},
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/users${q(params)}`,
  );
}

/** GET /vendor/users/:id */
export async function vendorGetUser(userId: string) {
  return vendorRequest<Record<string, unknown>>(`/vendor/users/${userId}`);
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** GET /vendor/notifications */
export async function vendorListNotifications(
  params: { limit?: number; skip?: number } = {},
) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/notifications${q(params)}`,
  );
}

/** PATCH /vendor/notifications/:id/read */
export async function vendorMarkNotificationRead(notificationId: string) {
  return vendorRequest<Record<string, unknown>>(
    `/vendor/notifications/${notificationId}/read`,
    "PATCH",
    {},
  );
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

// ─── File Upload ──────────────────────────────────────────────────────────────

/**
 * Upload a file (image/document) to the vendor backend.
 * Returns the URL of the uploaded file.
 */
export async function uploadVendorFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getVendorToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${V}/vendor/uploads/image`, {
    method: "POST",
    headers,
    body: formData,
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
