import { DashboardView } from "@/components/dashboard/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  stats: Array<{ label: string; value: string; sub: string; trend: string; icon: "tag" | "users" | "shopping_bag" | "calendar" | "smile" }>;
  monthlyData: Array<{ period: string; value: number }>;
  weeklyData: Array<{ period: string; value: number }>;
  bookingByRange: {
    weekly: Array<{ name: string; value: number; color: string }>;
    monthly: Array<{ name: string; value: number; color: string }>;
  };
  bookingTotals: {
    weekly: number;
    monthly: number;
  };
  vendors: Array<{ id: string; code: string; name: string; category: string; rating: string; revenue: string; status: string }>;
  details?: {
    users?: { total: number; active: number };
    vendors?: { total: number; active: number; pending: number; blocked: number };
    bookings?: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
    offers?: { total: number; active: number; inactive: number };
  };
  recentBookings?: Array<{ id: string; customer: string; vendor: string; type: string; amount: number; status: string; date: string }>;
};

const fallbackData: DataPayload = {
  stats: [],
  monthlyData: [],
  weeklyData: [],
  bookingByRange: {
    weekly: [],
    monthly: []
  },
  bookingTotals: {
    weekly: 0,
    monthly: 0
  },
  vendors: [],
  details: {},
  recentBookings: []
};

export async function DashboardViewServer() {
  const data = await fetchApiData<DataPayload>("/api/dashboard", fallbackData);
  return <DashboardView data={data} />;
}
