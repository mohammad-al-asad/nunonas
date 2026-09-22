import { BillingManagementView } from "@/components/billing/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  recentPayments: Array<{
    vendorCode: string;
    vendorName: string;
    totalEarnings: string;
    commission: string;
    netPayout: string;
    status: "PAID" | "PENDING";
  }>;
};

const fallbackData: DataPayload = {
  summaryCards: [],
  recentPayments: []
};

export async function BillingManagementViewServer() {
  const data = await fetchApiData<DataPayload>("/api/billing", fallbackData);
  return <BillingManagementView data={data} />;
}
