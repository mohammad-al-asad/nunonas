import { VendorsManagementView } from "@/components/vendors/client";
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

export async function VendorsManagementViewServer() {
  const data = await fetchApiData<DataPayload>("/api/vendors", fallbackData);
  return <VendorsManagementView data={data} />;
}
