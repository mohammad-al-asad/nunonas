"use client";

import type { SummaryCard, UserProfile } from "@/components/main/users-management-types";
import { useUsersManagement } from "@/components/main/users-management-logic";
import { UsersManagementUI } from "@/components/main/users-management-ui";

type UsersClientProps = {
  initialData: {
    summaryCards: SummaryCard[];
    users: UserProfile[];
  };
};

export function UsersClient({ initialData }: UsersClientProps) {
  const logic = useUsersManagement(initialData);
  return <UsersManagementUI {...logic} />;
}
