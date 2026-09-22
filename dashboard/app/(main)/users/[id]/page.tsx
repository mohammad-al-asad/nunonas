import { Suspense } from "react";
import { UserDetailPageClient } from "@/components/users/detail-client";
import { UserDetailSkeleton } from "@/components/users/detail-skeleton";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<UserDetailSkeleton />}>
      <UserDetailPageClient userId={id} />
    </Suspense>
  );
}
