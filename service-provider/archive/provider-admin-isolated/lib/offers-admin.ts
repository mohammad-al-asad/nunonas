type AnyRecord = Record<string, unknown>;

export type DashboardOffer = {
  id: string;
  name: string;
  discount: string;
  validity: string;
  appliedTo: string;
  status: "Active" | "Inactive";
  redemptions: number;
  kind: "PERCENT" | "FLAT" | "BOGO";
  startDate: string;
  endDate: string;
  discountValue: number;
  providerCount: number;
  engagedUsers: number;
  providerBreakdown: Array<{
    providerId: string;
    providerName: string;
    vendorCategory: string;
    status: string;
    redemptions: number;
    engagedUsers: number;
    active: boolean;
  }>;
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function validityText(startsAt: unknown, endsAt: unknown) {
  const start = formatDate(startsAt);
  const end = formatDate(endsAt);
  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "Ongoing";
}

export function mapAdminOffer(input: unknown): DashboardOffer {
  const record = asRecord(input);
  const kind = (asString(record.discount_type, "PERCENT").toUpperCase() as DashboardOffer["kind"]);
  const discountValue = asNumber(record.discount_value, asNumber(record.discount_percent, 0));
  const discount =
    kind === "PERCENT" ? `${discountValue}% Off` :
    kind === "FLAT" ? `$${discountValue.toFixed(2)} Flat` :
    "BOGO Free";

  return {
    id: asString(record.id),
    name: asString(record.name || record.title, "Untitled Offer"),
    discount,
    validity: validityText(record.starts_at, record.ends_at),
    appliedTo: asString(record.applied_to, "All Vendors"),
    status: record.is_active === false ? "Inactive" : "Active",
    redemptions: asNumber(record.redemptions, 0),
    kind: kind === "FLAT" || kind === "BOGO" ? kind : "PERCENT",
    startDate: asString(record.starts_at),
    endDate: asString(record.ends_at),
    discountValue,
    providerCount: asNumber(record.provider_count, 0),
    engagedUsers: asNumber(record.engaged_users, asNumber(record.redemptions, 0)),
    providerBreakdown: Array.isArray(record.provider_breakdown)
        ? record.provider_breakdown.map((item) => {
          const row = asRecord(item);
          return {
            providerId: asString(row.provider_id),
            providerName: asString(row.provider_name, "Unknown Vendor"),
            vendorCategory: asString(row.vendor_category, "Uncategorized"),
            status: asString(row.status, "inactive"),
            redemptions: asNumber(row.redemptions, 0),
            engagedUsers: asNumber(row.engaged_users, 0),
            active: row.active !== false,
          };
        })
      : [],
  };
}

export function buildOfferSummaryCards(offers: DashboardOffer[]) {
  const activeOffers = offers.filter((offer) => offer.status === "Active");
  const inactiveOffers = offers.filter((offer) => offer.status === "Inactive");
  const totalRedemptions = offers.reduce((sum, offer) => sum + offer.redemptions, 0);
  return [
    { label: "ACTIVE OFFERS", value: activeOffers.length.toLocaleString(), note: "Live now", tone: "text-[#16a34a]" },
    { label: "EXPIRED OFFERS", value: inactiveOffers.length.toLocaleString(), note: "Inactive offers", tone: "text-[#8b96ad]" },
    { label: "TOTAL REDEMPTIONS", value: totalRedemptions.toLocaleString(), note: "All redemptions", tone: "text-[#16a34a]" },
    { label: "REVENUE GENERATED", value: "$0", note: "Not tracked yet", tone: "text-[#8b96ad]" },
  ];
}
