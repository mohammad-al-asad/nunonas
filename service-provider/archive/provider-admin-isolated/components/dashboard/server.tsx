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
  vendors: Array<{ code: string; name: string; category: string; rating: string; revenue: string; status: string }>;
};

export async function DashboardViewServer() {
  const data = await fetchApiData<DataPayload>("/api/dashboard");
  return <DashboardView data={data} />;
}
