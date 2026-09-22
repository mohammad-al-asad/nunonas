type AnyRecord = Record<string, unknown>;

type VendorStatus = "PENDING" | "APPROVED" | "REJECTED";
type VendorCategory = "HOSPITALITY" | "DINING" | "RENTALS";

export type DashboardVendor = {
  id: string;
  businessName: string;
  owner: string;
  category: VendorCategory;
  bookings: number;
  rating: number;
  status: VendorStatus;
  avatar: string;
  verification: {
    description: string;
    address: string;
    reviewScore: number;
    reviewCount: number;
    docs: Array<{ title: string; state: "Verified" | "Rejected" }>;
  };
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

function normalizeStatus(value: unknown): VendorStatus {
  const status = String(value || "").toLowerCase();
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "PENDING";
}

function normalizeCategory(value: unknown): VendorCategory {
  const category = String(value || "").toLowerCase();
  if (category.includes("dining") || category.includes("restaurant") || category.includes("food")) return "DINING";
  if (category.includes("hotel") || category.includes("hospitality")) return "HOSPITALITY";
  return "RENTALS";
}

function fallbackAvatar(identity: string) {
  return `https://i.pravatar.cc/120?u=${encodeURIComponent(identity)}`;
}

function mapDocs(verification: AnyRecord): Array<{ title: string; state: "Verified" | "Rejected" }> {
  const docs: Array<{ title: string; state: "Verified" | "Rejected" }> = [];
  if (asString(verification.trade_license_document_url)) {
    docs.push({ title: "Trade License", state: "Verified" });
  }
  if (asString(verification.owner_manager_id_document_url)) {
    docs.push({ title: "Owner ID", state: "Verified" });
  }
  const urls = Array.isArray(verification.document_urls) ? verification.document_urls : [];
  urls.forEach((_, index) => {
    docs.push({ title: `Document ${index + 1}`, state: "Verified" });
  });
  if (docs.length === 0) {
    docs.push({ title: "No document uploaded", state: "Rejected" });
  }
  return docs;
}

export function mapVendorListItem(input: unknown): DashboardVendor {
  const record = asRecord(input);
  const sections = asRecord(record.sections);
  const profile = asRecord(sections.profile);
  const business = asRecord(sections.business);
  const verification = asRecord(sections.verification);
  const businessName = asString(record.business_name, "Unknown Vendor");
  const identity = asString(record.id) || businessName;
  const rating = asNumber(record.average_rating, 0);

  return {
    id: asString(record.id),
    businessName,
    owner: asString(record.owner_full_name) || asString(profile.owner_full_name, "Unknown Owner"),
    category: normalizeCategory(record.category || verification.category),
    bookings: asNumber(record.total_bookings, 0),
    rating,
    status: normalizeStatus(record.status),
    avatar: asString(record.logo_url) || fallbackAvatar(identity),
    verification: {
      description:
        asString(business.business_description) ||
        asString(profile.business_description) ||
        "Vendor description unavailable.",
      address:
        asString(business.address) ||
        [asString(business.city), asString(profile.city)].filter(Boolean).join(", ") ||
        "Address unavailable",
      reviewScore: rating,
      reviewCount: asNumber(record.total_reviews, 0),
      docs: mapDocs(verification),
    },
  };
}

export function mapVendorDetailPayload(input: unknown): DashboardVendor {
  const payload = asRecord(input);
  const vendor = asRecord(payload.vendor);
  const sections = asRecord(payload.sections);
  return mapVendorListItem({ ...vendor, sections });
}

export function buildVendorSummaryCards(vendors: DashboardVendor[]) {
  const total = vendors.length;
  const pending = vendors.filter((vendor) => vendor.status === "PENDING").length;
  const approved = vendors.filter((vendor) => vendor.status === "APPROVED").length;
  const rejected = vendors.filter((vendor) => vendor.status === "REJECTED").length;

  return [
    { label: "Total Vendors", value: total.toLocaleString(), note: "All registered vendors", tone: "text-[#64748b]" },
    { label: "Pending Approval", value: pending.toLocaleString(), note: "Awaiting admin review", tone: "text-[#f59e0b]" },
    { label: "Approved Vendors", value: approved.toLocaleString(), note: "Currently approved", tone: "text-[#16a34a]" },
    { label: "Rejected Vendors", value: rejected.toLocaleString(), note: "Need follow-up", tone: "text-[#ef4444]" },
  ];
}
