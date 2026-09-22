type AnyRecord = Record<string, unknown>;

export type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED";
export type VendorCategory = "HOSPITALITY" | "DINING" | "RENTALS";

export type VendorVerificationDocument = {
  title: string;
  url: string;
  status: "Verified" | "Rejected" | "Pending";
};

export type DashboardVendor = {
  id: string;
  businessName: string;
  owner: string;
  category: VendorCategory;
  bookings: number;
  rating: number;
  status: VendorStatus;
  avatar: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  verification: {
    description: string;
    address: string;
    reviewScore: number;
    reviewCount: number;
    status: string;
    rejectionReason: string;
    docs: VendorVerificationDocument[];
  };
  sections: {
    profile: AnyRecord;
    business: AnyRecord;
    verification: AnyRecord;
    adminReview: AnyRecord;
  };
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = Number(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }
  return fallback;
}

function normalizeStatus(value: unknown): VendorStatus {
  const status = String(value || "").toLowerCase();
  if (status === "approved") return "APPROVED";
  if (status === "blocked") return "BLOCKED";
  if (status === "rejected") return "REJECTED";
  return "PENDING";
}

function normalizeCategory(value: unknown): VendorCategory {
  const category = Array.isArray(value)
    ? value.map((item) => String(item || "")).find(Boolean)?.toLowerCase() ?? ""
    : String(value || "").toLowerCase();
  if (category.includes("dining") || category.includes("restaurant") || category.includes("food")) return "DINING";
  if (category.includes("hotel") || category.includes("hospitality")) return "HOSPITALITY";
  return "RENTALS";
}

function cleanSection(section: AnyRecord) {
  const cleaned = { ...section };
  delete cleaned._id;
  delete cleaned.vendor_id;
  return cleaned;
}

function composeAddress(...parts: unknown[]) {
  return parts
    .map((part) => asString(part).trim())
    .filter(Boolean)
    .join(", ");
}

function inferDocumentStatus(value: unknown): "Verified" | "Rejected" | "Pending" {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "approved" || normalized === "verified") return "Verified";
  if (normalized === "blocked" || normalized === "rejected") return "Rejected";
  return "Pending";
}

function mapDocs(
  verification: AnyRecord,
  adminReview: AnyRecord,
): VendorVerificationDocument[] {
  const docs: VendorVerificationDocument[] = [];
  const documentStatus = inferDocumentStatus(
    verification.status || adminReview.review_status,
  );

  const tradeLicenseUrl = asString(verification.trade_license_document_url);
  if (tradeLicenseUrl) {
    docs.push({ title: "Trade License", url: tradeLicenseUrl, status: documentStatus });
  }

  const ownerIdUrl = asString(verification.owner_manager_id_document_url);
  if (ownerIdUrl) {
    docs.push({ title: "Owner / Manager ID", url: ownerIdUrl, status: documentStatus });
  }

  const urls = Array.isArray(verification.document_urls) ? verification.document_urls : [];
  urls.forEach((value, index) => {
    const url = asString(value);
    if (url) {
      docs.push({ title: `Verification Document ${index + 1}`, url, status: documentStatus });
    }
  });

  return docs;
}

export function mapVendorListItem(input: unknown): DashboardVendor {
  const record = asRecord(input);
  const sections = asRecord(record.sections);
  const profile = cleanSection(asRecord(sections.profile));
  const business = cleanSection(asRecord(sections.business));
  const verification = cleanSection(asRecord(sections.verification));
  const adminReview = cleanSection(asRecord(sections.admin_review));

  const businessName =
    asString(record.business_name) ||
    asString(profile.business_name) ||
    asString(business.business_name) ||
    "Unknown Vendor";
  const owner =
    asString(record.owner_full_name) ||
    asString(profile.owner_full_name) ||
    asString(profile.contact_person_name) ||
    "Unknown Owner";
  const rating = asNumber(record.average_rating, 0);
  const address =
    composeAddress(
      business.address,
      business.city,
      business.state,
      business.country,
    ) ||
    composeAddress(
      profile.address,
      profile.city,
      profile.state,
      profile.country,
    ) ||
    "Address unavailable";

  return {
    id: asString(record.id),
    businessName,
    owner,
    category: normalizeCategory(
      record.category ||
      record.categories ||
      record.primary_category ||
      verification.category ||
      business.category,
    ),
    bookings: asNumber(record.total_bookings ?? record.bookings, 0),
    rating,
    status: normalizeStatus(
      record.status ||
      record.kyc_status ||
      verification.status ||
      adminReview.review_status,
    ),
    avatar:
      asString(record.logo_url) ||
      asString(business.logo_url) ||
      asString(profile.logo_url),
    email:
      asString(record.email) ||
      asString(profile.email) ||
      asString(profile.email_address),
    phone:
      asString(record.phone) ||
      asString(profile.phone) ||
      asString(profile.phone_number),
    createdAt: asString(record.created_at),
    updatedAt: asString(record.updated_at),
    verification: {
      description:
        asString(business.business_description) ||
        asString(profile.business_description) ||
        "Vendor description unavailable.",
      address,
      reviewScore: rating,
      reviewCount: asNumber(record.total_reviews, 0),
      status:
        asString(verification.status) ||
        asString(adminReview.review_status) ||
        asString(record.kyc_status) ||
        "pending_review",
      rejectionReason:
        asString(adminReview.rejection_reason) ||
        asString(verification.rejection_reason) ||
        asString(record.kyc_rejection_reason),
      docs: mapDocs(verification, adminReview),
    },
    sections: {
      profile,
      business,
      verification,
      adminReview,
    },
  };
}

export function mapVendorDetailPayload(input: unknown): DashboardVendor {
  const payload = asRecord(input);
  const vendor = asRecord(payload.vendor);
  const sections = asRecord(payload.sections);
  return mapVendorListItem({
    ...vendor,
    sections: {
      profile: asRecord(sections.profile),
      business: asRecord(sections.business),
      verification: asRecord(sections.verification),
      admin_review: asRecord(sections.admin_review),
    },
  });
}

export function buildVendorSummaryCards(vendors: DashboardVendor[]) {
  const total = vendors.length;
  const pending = vendors.filter((vendor) => vendor.status === "PENDING").length;
  const approved = vendors.filter((vendor) => vendor.status === "APPROVED").length;
  const blocked = vendors.filter((vendor) => vendor.status === "BLOCKED").length;

  return [
    { label: "Total Vendors", value: total.toLocaleString(), note: "All registered vendors", tone: "text-[#64748b]" },
    { label: "Pending Approval", value: pending.toLocaleString(), note: "Awaiting admin review", tone: "text-[#f59e0b]" },
    { label: "Approved Vendors", value: approved.toLocaleString(), note: "Currently approved", tone: "text-[#16a34a]" },
    { label: "Blocked Vendors", value: blocked.toLocaleString(), note: "Restricted by admin", tone: "text-[#ef4444]" },
  ];
}
