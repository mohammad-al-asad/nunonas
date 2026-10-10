export type LoyaltyStatus = "off" | "pending" | "active" | "rejected";

export type LoyaltyConfig = {
  points_rule_type: "points_per_currency" | "percentage_based";
  points_earned: number;
  currency_unit: number;
  percentage_value: number;
  first_booking_bonus: number;
  review_bonus_points: number;
  points_expiry_policy: "1 Year" | "2 Years" | "No Expiry";
  updated_at: string | null;
};

export type LoyaltyProvider = {
  vendor_id: string;
  business_name: string;
  email: string | null;
  categories: string[];
  status: LoyaltyStatus;
  requested_at: string | null;
  approved_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  can_turn_off_at: string | null;
};

export const defaultLoyaltyConfig: LoyaltyConfig = {
  points_rule_type: "points_per_currency",
  points_earned: 1,
  currency_unit: 10,
  percentage_value: 0,
  first_booking_bonus: 0,
  review_bonus_points: 0,
  points_expiry_policy: "1 Year",
  updated_at: null,
};

export function formatLoyaltyDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
