import { SupportDashboardView } from "@/components/support/client";
import { fetchApiData } from "@/lib/server-api";
import type { SupportTicket } from "@/lib/support";

export async function SupportDashboardViewServer() {
  const data = await fetchApiData<{ tickets: SupportTicket[] }>("/api/support", { tickets: [] });
  return <SupportDashboardView data={data} />;
}
