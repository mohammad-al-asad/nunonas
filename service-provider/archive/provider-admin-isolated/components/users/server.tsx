import { UsersClient } from "@/components/users/client";
import type { SummaryCard, UserProfile } from "@/components/main/users-management-types";
import { fetchApiData } from "@/lib/server-api";

type UsersData = {
  summaryCards: SummaryCard[];
  users: UserProfile[];
};

export async function UsersServer() {
  const data = await fetchApiData<UsersData>("/api/users");
  return <UsersClient initialData={data} />;
}
