import { VendorsManagementView } from "@/components/vendors/client";
import type { RevenueBreakdown } from "@/components/vendors/revenue-chart";
import { fetchApiData } from "@/lib/server-api";
import type { DashboardVendor } from "@/lib/vendors-admin";

type DataPayload = {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  vendors: DashboardVendor[];
};

const fallbackData: DataPayload = {
  summaryCards: [],
  vendors: []
};

const fallbackRevenue: RevenueBreakdown = {
  totalRevenue: 0,
  byType: [],
  byVendor: []
};

export async function VendorsManagementViewServer() {
  const [data, revenue] = await Promise.all([
    fetchApiData<DataPayload>("/api/vendors", fallbackData),
    fetchApiData<RevenueBreakdown>("/api/vendors/revenue", fallbackRevenue)
  ]);
  return <VendorsManagementView data={data} revenue={revenue} />;
}
