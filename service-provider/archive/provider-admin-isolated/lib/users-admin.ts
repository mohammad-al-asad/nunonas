import type { SummaryCard, UserProfile, UserStatus } from "@/components/main/users-management-types";

type AnyRecord = Record<string, unknown>;

const SUMMARY_CARD_TEMPLATES: SummaryCard[] = [
  {
    label: "TOTAL USERS",
    value: "0",
    trend: "+0%",
    tone: "text-[#18b67a] bg-[#dcf7ea]",
    icon: "users",
    iconWrap: "bg-[#e8eefb] text-[#27409b]",
  },
  {
    label: "ACTIVE USERS",
    value: "0",
    trend: "+0%",
    tone: "text-[#18b67a] bg-[#dcf7ea]",
    icon: "user",
    iconWrap: "bg-[#dcf7ea] text-[#27409b]",
  },
  {
    label: "BLOCKED USERS",
    value: "0",
    trend: "+0%",
    tone: "text-[#d94848] bg-[#fde7e7]",
    icon: "blocked",
    iconWrap: "bg-[#fde7e7] text-[#e11d48]",
  },
  {
    label: "NEW THIS MONTH",
    value: "0",
    trend: "+0%",
    tone: "text-[#f08a1e] bg-[#ffefdc]",
    icon: "new",
    iconWrap: "bg-[#fff4d8] text-[#f59e0b]",
  },
];

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function normalizeStatus(value: unknown): UserStatus {
  return String(value).toLowerCase() === "blocked" ? "BLOCKED" : "ACTIVE";
}

function avatarUrl(record: AnyRecord): string {
  const explicit = asString(record.profile_image_url) || asString(record.avatar);
  if (explicit) return explicit;
  const identity = asString(record.id) || asString(record.email) || asString(record.full_name) || "user";
  return `https://i.pravatar.cc/120?u=${encodeURIComponent(identity)}`;
}

function mapRecentBookings(record: AnyRecord): UserProfile["recentBookings"] {
  const raw = Array.isArray(record.recent_bookings) ? record.recent_bookings : [];
  return raw.map((item, index) => {
    const booking = asRecord(item);
    return {
      hotel: asString(booking.title, `Booking ${index + 1}`),
      range: asString(booking.range, "Scheduled"),
      amount: formatCurrency(asNumber(booking.amount, 0)),
      status: asString(booking.status, "PENDING"),
      image: asString(booking.image, `https://picsum.photos/seed/booking-${index}/80/80`),
    };
  });
}

export function mapAdminUserToProfile(input: unknown): UserProfile {
  const record = asRecord(input);
  const status = normalizeStatus(record.status);
  const id = asString(record.id) || asString(record._id);
  const name = asString(record.full_name, "Unknown User");
  const email = asString(record.email);
  const phone = asString(record.phone);
  const totalBookings = asNumber(record.total_bookings, 0);
  const totalSpent = asNumber(record.total_spent, 0);
  const location = asString(record.location, "Location unavailable");
  const recentBookings = mapRecentBookings(record);

  return {
    id,
    name,
    email,
    avatar: avatarUrl(record),
    status,
    totalBookings,
    joinedDate: asString(record.joined_date, "Unknown"),
    memberSince: asString(record.member_since, "Unknown"),
    age: asNumber(record.age, 0),
    stats: {
      bookings: totalBookings,
      spent: formatCurrency(totalSpent),
      rating: "N/A",
    },
    contacts: [
      { type: "mail", label: "Email Address", value: email || "Not provided" },
      { type: "phone", label: "Phone Number", value: phone || "Not provided" },
      { type: "pin", label: "Default Location", value: location },
    ],
    recentBookings,
    actions: [
      {
        label: status === "BLOCKED" ? "Unblock Account" : "Block Account",
        tone: status === "BLOCKED" ? "neutral" : "danger",
      },
      {
        label: "Reset Password",
        tone: "neutral",
      },
    ],
  };
}

export function buildUsersSummaryCards(users: UserProfile[], createdAts: string[]): SummaryCard[] {
  const now = new Date();
  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
  const blockedUsers = users.filter((user) => user.status === "BLOCKED").length;
  const newThisMonth = createdAts.filter((value) => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === now.getUTCFullYear() &&
      parsed.getUTCMonth() === now.getUTCMonth();
  }).length;

  return SUMMARY_CARD_TEMPLATES.map((card) => {
    if (card.label === "TOTAL USERS") return { ...card, value: users.length.toLocaleString() };
    if (card.label === "ACTIVE USERS") return { ...card, value: activeUsers.toLocaleString() };
    if (card.label === "BLOCKED USERS") return { ...card, value: blockedUsers.toLocaleString() };
    if (card.label === "NEW THIS MONTH") return { ...card, value: newThisMonth.toLocaleString() };
    return card;
  });
}
