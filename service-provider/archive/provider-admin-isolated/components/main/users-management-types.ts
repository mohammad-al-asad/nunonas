export type UserStatus = "ACTIVE" | "BLOCKED";
export type ContactType = "mail" | "phone" | "pin";
export type ActionTone = "danger" | "neutral";

export type BookingItem = {
  hotel: string;
  range: string;
  amount: string;
  status: string;
  image: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  totalBookings: number;
  joinedDate: string;
  memberSince: string;
  age: number;
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
