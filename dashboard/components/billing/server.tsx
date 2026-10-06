import { BillingManagementView } from "@/components/billing/client";
import { type BillingOverview, emptyBillingOverview } from "@/lib/billing";
import { fetchApiData } from "@/lib/server-api";

export async function BillingManagementViewServer() {
  const data = await fetchApiData<BillingOverview>("/api/billing", emptyBillingOverview);
  return <BillingManagementView data={data} />;
}
