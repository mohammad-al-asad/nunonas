import { SupportDashboardView } from "@/components/support/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  tickets: Array<{
    id: string;
    userName: string;
    userRole: "User" | "Vendor";
    avatar: string;
    type: "Account" | "Technical" | "Billing" | "Compliance";
    subject: string;
    status: "In Progress" | "Open" | "Resolved";
    priority: "High" | "Medium" | "Low";
    openedAt: string;
    issueDetails: string;
    conversation: Array<{ sender: "agent" | "user"; text: string; time: string; name?: string }>;
  }>;
};

const fallbackData: DataPayload = {
  summaryCards: [],
  tickets: []
};

export async function SupportDashboardViewServer() {
  const data = await fetchApiData<DataPayload>("/api/support", fallbackData);
  return <SupportDashboardView data={data} />;
}
