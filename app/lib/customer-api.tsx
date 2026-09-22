/**
 * Complete API module for customer-facing endpoints.
 * Function names are kept stable so existing screens can migrate incrementally.
 */

import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import { apiDeleteAuth, apiGetAuth, apiPatchAuth, apiPostAuth, apiPostAuthForm } from "./auth-api";

const V1 = "/api/v1";
const C = `${V1}/customer`;
const SERVICES = V1;

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type JsonObject = Record<string, unknown>;

type UserProfilePayload = {
  id?: string | number | null;
  full_name?: string | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  profile_image_url?: string | null;
  created_at?: string | null;
  points_balance?: number | string | null;
  location_enabled?: boolean | null;
  notification_preferences?: { nearby_events?: boolean; booking_reminders?: boolean } | null;
};

type UploadableFile = {
  uri: string;
  fileName?: string | null;
  name?: string | null;
  mimeType?: string | null;
  type?: string | null;
};

type AuthTokenPayload = {
  access_token?: string | null;
  refresh_token?: string | null;
  session_token?: string | null;
};

export type BookingResponse = {
  id?: string | number;
  booking_id?: string | number;
  booking_code?: string;
  bookingCode?: string;
  status?: string;
  provider_id?: string;
  provider_type?: string;
  estimated_points?: number;
  total_amount?: number;
  discount_amount?: number;
  promotion_name?: string | null;
};

export type BookingQuote = {
  provider_id?: string;
  provider_name?: string;
  provider_type?: string;
  service_id?: string;
  service_name?: string;
  room_id?: string;
  room_name?: string;
  date?: string;
  time?: string;
  check_in_date?: string;
  check_out_date?: string;
  nights?: number;
  guests?: number;
  unit_price?: number;
  rate_per_night?: number;
  original_subtotal?: number;
  room_discount_amount?: number;
  discount_amount?: number;
  promotion_name?: string | null;
  promo_code?: string | null;
  subtotal?: number;
  service_fee?: number;
  taxes?: number;
  tax_included?: boolean;
  total?: number;
  estimated_points?: number;
};

export type RestaurantTableBookingPayload = {
  date: string;
  time: string;
  guests: number;
  seating_preference?: string;
  special_notes?: string;
  auto_confirm?: boolean;
  promo_code?: string;
};

export type HotelStayBookingPayload = {
  check_in_date: string;
  check_out_date: string;
  guests: number;
  special_notes?: string;
  auto_confirm?: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  room_id?: string;
  promo_code?: string;
};

export type SpaBookingPayload = {
  date: string;
  time: string;
  guests: number;
  service_id?: string;
  special_notes?: string;
  auto_confirm?: boolean;
  promo_code?: string;
};

export type NormalizedUserProfile = {
  id: string | number;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  date_of_birth: string;
  profile_image_url: string;
  created_at: string | null;
  member_since: string;
  points_balance: number;
  location_enabled: boolean;
  notification_preferences: { nearby_events: boolean; booking_reminders: boolean };
};

function memberSinceLabel(createdAt: string | null | undefined): string {
  if (!createdAt) return "";
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function normalizeUserProfile(profile: UserProfilePayload = {}): NormalizedUserProfile {
  return {
    id: profile.id ?? "",
    full_name: profile.full_name ?? "",
    gender: profile.gender ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    date_of_birth: profile.date_of_birth ?? "",
    profile_image_url: profile.profile_image_url ?? "",
    created_at: profile.created_at ?? null,
    member_since: memberSinceLabel(profile.created_at),
    points_balance: Number(profile.points_balance ?? 0),
    location_enabled: Boolean(profile.location_enabled),
    notification_preferences: {
      nearby_events: profile.notification_preferences?.nearby_events ?? false,
      booking_reminders: profile.notification_preferences?.booking_reminders ?? true,
    },
  };
}

function buildQuery(params: QueryParams = {}): string {
  const entries = Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!entries.length) return "";

  return `?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")}`;
}

export async function getHomeFeed<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/home`);
}

export async function getTrendingHotels<TResponse = unknown>(limit = 6): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/trending/hotels${buildQuery({ limit })}`);
}

export async function getUnreadNotificationCount<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/notifications/unread-count`);
}

export async function listNotifications<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/notifications`);
}

export async function getCurrentLocation<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/location/current`);
}

export async function updateCurrentLocation<TResponse = unknown>(
  data: JsonObject,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { data: JsonObject }>(`${C}/location/current`, { data });
}

export async function listCategories<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/categories`);
}

export async function listRestaurants<TResponse = unknown>(
  params: QueryParams = {},
): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants${buildQuery(params)}`);
}

export async function getRestaurant<TResponse = unknown>(restaurantId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants/${restaurantId}`);
}

export async function getRestaurantMenu<TResponse = unknown>(restaurantId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants/${restaurantId}/menu`);
}

export async function getRestaurantGallery<TResponse = unknown>(restaurantId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants/${restaurantId}/gallery`);
}

export async function getRestaurantOffers<TResponse = unknown>(restaurantId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants/${restaurantId}/offers`);
}

export async function getRestaurantServices<TResponse = unknown>(restaurantId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants/${restaurantId}/services`);
}

export async function getRestaurantReviews<TResponse = unknown>(restaurantId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/restaurants/${restaurantId}/reviews`);
}

export async function getSpaReviews<TResponse = unknown>(spaId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas/${spaId}/reviews`);
}

export async function listSpas<TResponse = unknown>(params: QueryParams = {}): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas${buildQuery(params)}`);
}

export async function getSpa<TResponse = unknown>(spaId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas/${spaId}`);
}

export async function getSpaMenu<TResponse = unknown>(spaId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas/${spaId}/menu`);
}

export async function getSpaGallery<TResponse = unknown>(spaId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas/${spaId}/gallery`);
}

export async function getSpaOffers<TResponse = unknown>(spaId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas/${spaId}/offers`);
}

export async function getSpaServices<TResponse = unknown>(spaId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/spas/${spaId}/services`);
}

export async function listEvents<TResponse = unknown>(params: QueryParams = {}): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/events${buildQuery(params)}`);
}

export async function getEvent<TResponse = unknown>(eventId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/events/${eventId}`);
}

export async function getEventDirections<TResponse = unknown>(eventId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/events/${eventId}/directions`);
}

export async function bookEventTickets<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  eventId: string,
  payload: TBody,
): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${C}/events/${eventId}/bookings`, payload);
}

export async function getEventBookingQuote<
  TResponse = BookingQuote,
  TBody extends { quantity: number; auto_confirm?: boolean; promo_code?: string } = { quantity: number; auto_confirm?: boolean; promo_code?: string },
>(eventId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${C}/events/${eventId}/booking-quote`, payload);
}

export async function listHotels<TResponse = unknown>(params: QueryParams = {}): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/hotels${buildQuery(params)}`);
}

export async function getHotel<TResponse = unknown>(hotelId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/hotels/${hotelId}`);
}

export async function listHotelRooms<TResponse = unknown>(
  hotelId: string,
  params: QueryParams = {},
): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/hotels/${hotelId}/rooms${buildQuery(params)}`);
}

export async function getHotelRoom<TResponse = unknown>(roomId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/hotels/rooms/${roomId}`);
}

export async function getHotelGallery<TResponse = unknown>(hotelId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/hotels/${hotelId}/gallery`);
}

export async function getHotelReviews<TResponse = unknown>(hotelId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${SERVICES}/hotels/${hotelId}/reviews`);
}

export async function globalSearch<TResponse = unknown>(
  q: string,
  params: QueryParams = {},
): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/search${buildQuery({ q, ...params })}`);
}

export async function listRecentSearches<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/search/recent`);
}

export async function clearRecentSearches<TResponse = unknown>(): Promise<TResponse> {
  return apiDeleteAuth<TResponse>(`${C}/search/recent`);
}

export async function getMapPins<TResponse = unknown>(limit = 50): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/map/pins${buildQuery({ limit })}`);
}

export async function getMapEvents<TResponse = unknown>(limit = 50): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/map/events${buildQuery({ limit })}`);
}

export async function getMapHighlight<TResponse = unknown>(
  restaurantId: string | null | undefined,
): Promise<TResponse> {
  const query = restaurantId ? buildQuery({ restaurant_id: restaurantId }) : "";
  return apiGetAuth<TResponse>(`${C}/map/highlight${query}`);
}

export async function getFilters<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/filters`);
}

export async function getBookingAvailability<TResponse = unknown>(
  providerId: string,
  date: string,
  providerType: "restaurant" | "hotel" | "spa" = "restaurant",
): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/bookings/availability${buildQuery({ provider_id: providerId, date, provider_type: providerType })}`);
}

export async function getBookingQuote<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${C}/bookings/quote`, payload);
}

export async function createBooking<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${C}/bookings`, payload);
}

export async function bookRestaurantTable<
  TResponse = BookingResponse,
  TBody extends RestaurantTableBookingPayload = RestaurantTableBookingPayload,
>(restaurantId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${SERVICES}/restaurants/${restaurantId}/bookings`, payload);
}

export async function bookHotelStay<
  TResponse = BookingResponse,
  TBody extends HotelStayBookingPayload = HotelStayBookingPayload,
>(hotelId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${SERVICES}/hotels/${hotelId}/bookings`, payload);
}

export async function bookHotelRoom<
  TResponse = BookingResponse,
  TBody extends Omit<HotelStayBookingPayload, "room_id"> = Omit<HotelStayBookingPayload, "room_id">,
>(roomId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${SERVICES}/hotels/rooms/${roomId}/bookings`, payload);
}

export async function getHotelBookingQuote<
  TResponse = BookingQuote,
  TBody extends Pick<HotelStayBookingPayload, "check_in_date" | "check_out_date" | "guests" | "room_id" | "promo_code"> = Pick<HotelStayBookingPayload, "check_in_date" | "check_out_date" | "guests" | "room_id" | "promo_code">,
>(hotelId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${SERVICES}/hotels/${hotelId}/booking-quote`, payload);
}

export async function getSpaBookingQuote<
  TResponse = BookingQuote,
  TBody extends SpaBookingPayload = SpaBookingPayload,
>(spaId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${SERVICES}/spas/${spaId}/booking-quote`, payload);
}

export async function bookSpa<
  TResponse = BookingResponse,
  TBody extends SpaBookingPayload = SpaBookingPayload,
>(spaId: string, payload: TBody): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${SERVICES}/spas/${spaId}/bookings`, payload);
}

export async function listMyBookings<TResponse = unknown>(
  params: QueryParams = {},
): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/bookings${buildQuery(params)}`);
}

export async function getBooking<TResponse = unknown>(bookingId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/bookings/${bookingId}`);
}

export async function confirmBooking<TResponse = unknown>(bookingId: string): Promise<TResponse> {
  return apiPostAuth<TResponse, JsonObject>(`${C}/bookings/${bookingId}/confirm`, {});
}

export async function cancelBooking<TResponse = unknown>(
  bookingId: string,
  reason: string,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { reason: string }>(`${C}/bookings/${bookingId}/cancel`, { reason });
}

export async function createBookingReview<TResponse = unknown>(
  bookingId: string,
  payload: { rating: number; review_text: string },
): Promise<TResponse> {
  return apiPostAuth<TResponse, { rating: number; review_text: string }>(
    `${C}/bookings/${bookingId}/review`,
    payload,
  );
}

export async function listMyReviews<TResponse = unknown>(
  params: QueryParams = {},
): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/reviews${buildQuery(params)}`);
}

export async function rescheduleBooking<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  bookingId: string,
  payload: TBody,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, TBody>(`${C}/bookings/${bookingId}/reschedule`, payload);
}

export async function listSaved<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/saved`);
}

export async function addSaved<TResponse = unknown>(
  entityType: string,
  entityId: string,
): Promise<TResponse> {
  return apiPostAuth<TResponse, JsonObject>(`${C}/saved/${entityType}/${entityId}`, {});
}

export async function removeSaved<TResponse = unknown>(
  entityType: string,
  entityId: string,
): Promise<TResponse> {
  return apiDeleteAuth<TResponse>(`${C}/saved/${entityType}/${entityId}`);
}

export async function listAiSessions<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/ai-concierge/sessions`);
}

export async function createAiSession<TResponse = unknown>(): Promise<TResponse> {
  return apiPostAuth<TResponse, JsonObject>(`${C}/ai-concierge/sessions`, {});
}

export async function listAiMessages<TResponse = unknown>(sessionId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/ai-concierge/sessions/${sessionId}/messages`);
}

export async function sendAiMessage<TResponse = unknown>(
  sessionId: string,
  message: string,
): Promise<TResponse> {
  return apiPostAuth<TResponse, { message: string; metadata: JsonObject }>(
    `${C}/ai-concierge/sessions/${sessionId}/messages`,
    {
      message,
      metadata: {},
    },
  );
}

export async function getCustomerProfile<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/profile`);
}

export async function updateCustomerProfile<TResponse = unknown>(
  data: JsonObject,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { data: JsonObject }>(`${C}/profile`, { data });
}

export async function updateNotificationPreferences<TResponse = unknown>(
  data: JsonObject,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { data: JsonObject }>(`${C}/profile/notification-preferences`, { data });
}

export async function getPointsSummary<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${C}/points/summary`);
}

export async function createPlanSession<TResponse = unknown>(): Promise<TResponse> {
  return apiPostAuth<TResponse, JsonObject>(`${C}/plan-for-me/sessions`, {});
}

export async function setPlanCompanions<TResponse = unknown>(
  sessionId: string,
  value: string | number | boolean,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { value: string | number | boolean }>(
    `${C}/plan-for-me/sessions/${sessionId}/companions`,
    { value },
  );
}

export async function setPlanMood<TResponse = unknown>(
  sessionId: string,
  value: string | number | boolean,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { value: string | number | boolean }>(
    `${C}/plan-for-me/sessions/${sessionId}/mood`,
    { value },
  );
}

export async function setPlanBudget<TResponse = unknown>(
  sessionId: string,
  value: string | number | boolean,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { value: string | number | boolean }>(
    `${C}/plan-for-me/sessions/${sessionId}/budget`,
    { value },
  );
}

export async function setPlanPreferences<TResponse = unknown>(
  sessionId: string,
  value: string | number | boolean,
): Promise<TResponse> {
  return apiPatchAuth<TResponse, { value: string | number | boolean }>(
    `${C}/plan-for-me/sessions/${sessionId}/preferences`,
    { value },
  );
}

export async function revealPlan<TResponse = unknown>(sessionId: string): Promise<TResponse> {
  return apiPostAuth<TResponse, JsonObject>(`${C}/plan-for-me/sessions/${sessionId}/reveal`, {});
}

export async function getMe(): Promise<NormalizedUserProfile> {
  return normalizeUserProfile(await apiGetAuth<UserProfilePayload>(`${V1}/users/me`));
}

export async function getLegalDocument<TResponse = unknown>(docType: string): Promise<TResponse> {
  return apiGet<TResponse>(`${V1}/legal/${docType}`);
}

export async function updatePersonalDetails<TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<NormalizedUserProfile> {
  return normalizeUserProfile(await apiPatchAuth<UserProfilePayload, TBody>(`${V1}/users/me/personal-details`, payload));
}

export async function uploadProfileImage<TResponse = unknown>(file: UploadableFile): Promise<TResponse> {
  const formData = new FormData();
  formData.append(
    "file",
    {
      uri: file.uri,
      name: file.fileName ?? file.name ?? "profile-image.jpg",
      type: file.mimeType ?? file.type ?? "image/jpeg",
    } as unknown as Blob,
  );
  return apiPostAuthForm<TResponse>(`${V1}/users/me/profile-image`, formData);
}

export async function getMyBookings<TResponse = unknown>(
  status: string | null | undefined,
): Promise<TResponse> {
  const query = status ? buildQuery({ status }) : "";
  return apiGetAuth<TResponse>(`${V1}/users/me/bookings${query}`);
}

export async function getMyLoyalty<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${V1}/users/me/loyalty`);
}

export async function listMySupportTickets<TResponse = unknown>(): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${V1}/users/me/support/tickets`);
}

export async function createSupportTicket<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPostAuth<TResponse, TBody>(`${V1}/users/me/support/tickets`, payload);
}

export async function getSupportTicket<TResponse = unknown>(ticketId: string): Promise<TResponse> {
  return apiGetAuth<TResponse>(`${V1}/users/me/support/tickets/${ticketId}`);
}

export async function replyToSupportTicket<TResponse = unknown>(
  ticketId: string,
  message: string,
): Promise<TResponse> {
  return apiPostAuth<TResponse, { message: string }>(`${V1}/users/me/support/tickets/${ticketId}/messages`, {
    message,
  });
}

export async function register<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPost<TResponse, TBody>(`${V1}/auth/register`, payload);
}

export async function verifyEmail<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPost<TResponse, TBody>(`${V1}/auth/verify-email`, payload);
}

export async function login<TResponse = AuthTokenPayload, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPost<TResponse, TBody>(`${V1}/auth/login`, payload);
}

export async function socialLogin<TResponse = AuthTokenPayload, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPost<TResponse, TBody>(`${V1}/auth/social-login`, payload);
}

export async function refreshToken<TResponse = AuthTokenPayload>(
  refreshTokenValue: string,
): Promise<TResponse> {
  return apiPost<TResponse, { refresh_token: string }>(`${V1}/auth/refresh`, {
    refresh_token: refreshTokenValue,
  });
}

export async function logout<TResponse = unknown>(refreshTokenValue: string): Promise<TResponse> {
  return apiPost<TResponse, { refresh_token: string }>(`${V1}/auth/logout`, {
    refresh_token: refreshTokenValue,
  });
}

export async function forgotPassword<TResponse = unknown>(email: string): Promise<TResponse> {
  return apiPost<TResponse, { email: string }>(`${V1}/auth/forgot-password`, { email });
}

export async function verifyOtp<TResponse = unknown>(email: string, otp: string): Promise<TResponse> {
  return apiPost<TResponse, { email: string; otp: string }>(`${V1}/auth/verify-otp`, { email, otp });
}

export async function resetPassword<TResponse = unknown, TBody extends JsonObject = JsonObject>(
  payload: TBody,
): Promise<TResponse> {
  return apiPost<TResponse, TBody>(`${V1}/auth/reset-password`, payload);
}
