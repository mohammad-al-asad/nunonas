export type OfferState = "upcoming" | "live" | "ended";
export type OfferDiscountType = "percentage" | "fixed_amount";
export type ProviderResponse = "pending" | "accepted" | "rejected";

export type PlatformOffer = {
  id: string;
  name: string;
  purpose: string;
  discount_type: OfferDiscountType;
  discount_value: number;
  discount_label: string;
  start_date: string;
  end_date: string;
  state: OfferState;
  created_at: string | null;
  accepted: number;
  rejected: number;
  pending: number;
  bookings: number;
};

export type PlatformOfferDetail = Omit<PlatformOffer, "accepted" | "rejected" | "pending" | "bookings"> & {
  providers: Array<{
    vendor_id: string;
    business_name: string;
    status: ProviderResponse;
    responded_at: string | null;
    bookings: number;
  }>;
};

export function formatOfferDay(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
