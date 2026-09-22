export type UserStatus = "ACTIVE" | "BLOCKED";
export type ContactType = "mail" | "phone" | "pin";
export type ActionTone = "danger" | "neutral";

export type BookingItem = {
  id: string;
  hotel: string;
  service: string;
  range: string;
  date: string;
  time: string;
  bookingCode: string;
  amount: string;
  status: string;
  paymentStatus: string;
  guests: string;
  staff: string;
  notes: string;
  seating: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  requestedAt: string;
  acceptedAt: string;
  completedAt: string;
  canceledAt: string;
  statusNote: string;
  statusHistory: Array<{ status?: string; at?: string; actor?: string; label?: string; note?: string }>;
  image: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: UserStatus;
  totalBookings: number;
  joinedDate: string;
  memberSince: string;
  age: number;
  createdAt: string;
  updatedAt: string;
  pointsBalance: number;
  stats: {
    bookings: number;
    spent: string;
    rating: string;
  };
  contacts: Array<{
    type: ContactType;
    label: string;
    value: string;
  }>;
  recentBookings: BookingItem[];
  actions: Array<{
    label: string;
    tone: ActionTone;
  }>;
};

export type SummaryCard = {
  label: string;
  value: string;
  trend: string;
  tone: string;
  icon: "users" | "user" | "blocked" | "new";
  iconWrap: string;
};
