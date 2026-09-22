import { UsersClient } from "@/components/users/client";
import type { SummaryCard, UserProfile } from "@/components/main/users-management-types";
import { fetchApiData } from "@/lib/server-api";

type UsersData = {
  summaryCards: SummaryCard[];
  users: UserProfile[];
};

const fallbackData: UsersData = {
  summaryCards: [],
  users: []
};

export async function UsersServer() {
  const data = await fetchApiData<UsersData>("/api/users", fallbackData);
  return <UsersClient initialData={data} />;
}
