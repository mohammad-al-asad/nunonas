import { DashboardView, type DashboardData } from "@/components/dashboard/client";
import { fetchApiData } from "@/lib/server-api";

const fallbackData: DashboardData = {
  stats: [],
  monthlyData: [],
  weeklyData: [],
  customData: [],
  bookingByRange: {
    weekly: [],
    monthly: [],
    custom: []
  },
  bookingTotals: {
    weekly: 0,
    monthly: 0,
    custom: 0
  },
  vendors: [],
  details: {},
  recentBookings: []
};

export async function DashboardViewServer() {
  const data = await fetchApiData<DashboardData>("/api/dashboard", fallbackData);
  return <DashboardView data={data} />;
}
