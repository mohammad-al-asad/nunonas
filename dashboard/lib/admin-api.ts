/**
 * admin-api.ts
 * Complete API client for all Platform Admin endpoints.
 * Reads token from localStorage (set during login).
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "").replace(/\/+$/, "");
const V1 = `${API_BASE_URL}/api/v1`;
const PA = `${V1}/platform-admin`;

// ─── Token helpers ──────────────────────────────────────────────────────────

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_access_token");
}

function getAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_refresh_token");
}

export function saveAdminToken(token: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("admin_access_token", token);
  if (refreshToken) localStorage.setItem("admin_refresh_token", refreshToken);
}

export function clearAdminTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
}

// ─── Base request ───────────────────────────────────────────────────────────

let adminRefreshPromise: Promise<string | null> | null = null;

async function refreshAdminAccessToken(): Promise<string | null> {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) {
    return null;
  }
  if (adminRefreshPromise) {
    return adminRefreshPromise;
  }

  adminRefreshPromise = (async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const result = (await response.json().catch(() => ({}))) as AdminAuthResult & {
      detail?: string;
      message?: string;
    };
    if (!response.ok || !result.access_token) {
      clearAdminTokens();
      return null;
    }
    saveAdminToken(result.access_token, result.refresh_token ?? result.session_token);
    return result.access_token;
  })();

  try {
    return await adminRefreshPromise;
  } finally {
    adminRefreshPromise = null;
  }
}

async function adminRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, unknown>,
  requireAuth = true,
  retryOnAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const token = getAdminToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const result = (await response.json().catch(() => ({}))) as T & {
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 401 && requireAuth) {
      if (retryOnAuth) {
        const refreshedToken = await refreshAdminAccessToken();
        if (refreshedToken) {
          return adminRequest<T>(path, method, body, requireAuth, false);
        }
      }
      clearAdminTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new Error(
      (result as { detail?: string; message?: string }).detail ||
        (result as { detail?: string; message?: string }).message ||
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
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminAuthResult {
  access_token: string;
  refresh_token?: string;
  session_token?: string;
  admin?: Record<string, unknown>;
}

export async function adminRequestCode(payload: { email_or_phone: string }) {
  return adminRequest(`${PA}/auth/register/request-code`, "POST", payload, false);
}

export async function adminVerifyRegisterCode(payload: {
  email_or_phone: string;
  validation_code: string;
}) {
  return adminRequest(`${PA}/auth/register/verify-code`, "POST", payload, false);
}

export async function adminRegister(payload: {
  signup_token: string;
  email_or_phone: string;
  full_name: string;
  password: string;
  confirm_password: string;
}) {
  return adminRequest<AdminAuthResult>(`${PA}/auth/register`, "POST", payload, false);
}

export async function adminLogin(payload: {
  email_or_phone: string;
  password: string;
}) {
  const result = await adminRequest<AdminAuthResult>(
    `${PA}/auth/login`,
    "POST",
    payload,
    false,
  );
  if (result.access_token) {
    saveAdminToken(result.access_token, result.refresh_token ?? result.session_token);
  }
  return result;
}

export async function adminRefreshSession(refreshToken: string) {
  const result = await adminRequest<AdminAuthResult>(
    `${PA}/auth/refresh`,
    "POST",
    { refresh_token: refreshToken },
    false,
    false,
  );
  if (result.access_token) {
    saveAdminToken(result.access_token, result.refresh_token ?? result.session_token);
  }
  return result;
}

export async function adminForgotPasswordRequest(payload: {
  email_or_phone: string;
}) {
  return adminRequest(`${PA}/auth/forgot-password/request`, "POST", payload, false);
}

export async function adminForgotPasswordVerifyCode(payload: {
  email_or_phone: string;
  validation_code: string;
}) {
  return adminRequest(`${PA}/auth/forgot-password/verify-code`, "POST", payload, false);
}

export async function adminResetPassword(payload: {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}) {
  return adminRequest(`${PA}/auth/forgot-password/reset`, "POST", payload, false);
}

export async function adminGetMe() {
  return adminRequest<Record<string, unknown>>(`${PA}/auth/me`);
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function adminGetDashboardOverview() {
  return adminRequest<Record<string, unknown>>(`${PA}/dashboard/overview`);
}

export async function adminGetRevenueGrowth() {
  return adminRequest<Record<string, unknown>>(`${PA}/dashboard/revenue-growth`);
}

export async function adminGetBookingInsights() {
  return adminRequest<Record<string, unknown>>(`${PA}/dashboard/booking-insights`);
}

export async function adminGetVendorPerformance() {
  return adminRequest<Record<string, unknown>>(`${PA}/dashboard/vendor-performance`);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function adminListUsers(params: {
  limit?: number;
  skip?: number;
  search?: string;
  status?: string;
} = {}) {
  return adminRequest<{ users: Record<string, unknown>[]; total: number }>(
    `${PA}/users${q(params)}`,
  );
}

export async function adminGetUser(userId: string) {
  return adminRequest<Record<string, unknown>>(`${PA}/users/${userId}`);
}

export async function adminUpdateUserStatus(
  userId: string,
  status: string,
) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/users/${userId}/status`,
    "PATCH",
    { status },
  );
}

export async function adminResetUserPassword(userId: string) {
  return adminRequest(`${PA}/users/${userId}/password-reset-request`, "POST", {});
}

export async function adminGetUserBookings(userId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/users/${userId}/bookings`,
  );
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function adminListVendors(params: {
  limit?: number;
  skip?: number;
  search?: string;
  status?: string;
} = {}) {
  return adminRequest<{ vendors: Record<string, unknown>[]; total: number }>(
    `${PA}/vendors${q(params)}`,
  );
}

export async function adminGetVendor(vendorId: string) {
  return adminRequest<Record<string, unknown>>(`${PA}/vendors/${vendorId}`);
}

export async function adminGetVendorSections(vendorId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/vendors/${vendorId}/sections`,
  );
}

export async function adminDecideVendorVerification(
  vendorId: string,
  decision: string,
  rejectionReason?: string,
) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/vendors/${vendorId}/verification`,
    "PATCH",
    { decision, rejection_reason: rejectionReason },
  );
}

export async function adminGetVendorDocuments(vendorId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/vendors/${vendorId}/documents`,
  );
}

// ─── Moderation ──────────────────────────────────────────────────────────────

export async function adminListModerationSubmissions(params: {
  limit?: number;
  skip?: number;
  status?: string;
} = {}) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/moderation/submissions${q(params)}`,
  );
}

export async function adminGetModerationSubmission(submissionId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/moderation/submissions/${submissionId}`,
  );
}

export async function adminDecideModeration(
  submissionId: string,
  status: string,
  note?: string,
) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/moderation/submissions/${submissionId}/decision`,
    "PATCH",
    { status, note },
  );
}

// ─── Offers ──────────────────────────────────────────────────────────────────

export async function adminListOffers(params: Record<string, unknown> = {}) {
  return adminRequest<Record<string, unknown>>(`${PA}/offers${q(params)}`);
}

export async function adminCreateOffer(data: Record<string, unknown>) {
  return adminRequest<Record<string, unknown>>(`${PA}/offers`, "POST", { data });
}

export async function adminGetOffer(offerId: string) {
  return adminRequest<Record<string, unknown>>(`${PA}/offers/${offerId}`);
}

export async function adminUpdateOffer(
  offerId: string,
  data: Record<string, unknown>,
) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/offers/${offerId}`,
    "PATCH",
    { data },
  );
}

export async function adminUpdateOfferStatus(offerId: string, status: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/offers/${offerId}/status`,
    "PATCH",
    { status },
  );
}

export async function adminDeleteOffer(offerId: string) {
  return adminRequest(`${PA}/offers/${offerId}`, "DELETE");
}

export async function adminListOfferProviders(offerId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/offers/${offerId}/providers`,
  );
}

export async function adminUpdateOfferProvider(
  offerId: string,
  providerId: string,
  status: string,
) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/offers/${offerId}/providers/${providerId}`,
    "PATCH",
    { status },
  );
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export async function adminGetBillingOverview() {
  return adminRequest<Record<string, unknown>>(`${PA}/billing/overview`);
}

export async function adminListPayments(params: Record<string, unknown> = {}) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/billing/payments${q(params)}`,
  );
}

export async function adminGetPayment(paymentId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/billing/payments/${paymentId}`,
  );
}

export async function adminGetPaymentInvoice(paymentId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/billing/payments/${paymentId}/invoice`,
  );
}

export async function adminSendPaymentReminder(paymentId: string) {
  return adminRequest(
    `${PA}/billing/payments/${paymentId}/send-reminder`,
    "POST",
    {},
  );
}

export async function adminMarkPaymentPaid(paymentId: string) {
  return adminRequest(
    `${PA}/billing/payments/${paymentId}/mark-paid`,
    "POST",
    {},
  );
}

// ─── Support ─────────────────────────────────────────────────────────────────

export async function adminListSupportTickets(
  params: Record<string, unknown> = {},
) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/support/tickets${q(params)}`,
  );
}

export async function adminGetSupportTicket(ticketId: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/support/tickets/${ticketId}`,
  );
}

export async function adminReplySupportTicket(
  ticketId: string,
  message: string,
) {
  return adminRequest(`${PA}/support/tickets/${ticketId}/messages`, "POST", {
    message,
    metadata: {},
  });
}

export async function adminUpdateTicketStatus(
  ticketId: string,
  status: string,
) {
  return adminRequest(`${PA}/support/tickets/${ticketId}/status`, "PATCH", {
    status,
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function adminGetGeneralSettings() {
  return adminRequest<Record<string, unknown>>(`${PA}/settings/general`);
}

export async function adminUpdateGeneralSettings(data: Record<string, unknown>) {
  return adminRequest(`${PA}/settings/general`, "PATCH", { data });
}

export async function adminUpdateCommissionSettings(
  data: Record<string, unknown>,
) {
  return adminRequest(`${PA}/settings/commission`, "PATCH", { data });
}

export async function adminGetLegalDoc(docType: string) {
  return adminRequest<Record<string, unknown>>(
    `${PA}/settings/legal/${docType}`,
  );
}

export async function adminUpdateLegalDoc(
  docType: string,
  data: Record<string, unknown>,
) {
  return adminRequest(`${PA}/settings/legal/${docType}`, "PATCH", { data });
}

export async function adminGetProfileSettings() {
  return adminRequest<Record<string, unknown>>(`${PA}/settings/profile`);
}

export async function adminUpdateProfileSettings(
  data: Record<string, unknown>,
) {
  return adminRequest(`${PA}/settings/profile`, "PATCH", { data });
}

export async function adminUpdatePassword(data: {
  old_password: string;
  new_password: string;
}) {
  return adminRequest(`${PA}/settings/password`, "PATCH", { data });
}
