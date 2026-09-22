import { Suspense } from "react";
import { VendorDetailPageClient } from "@/components/vendors/detail-client";
import { VendorDetailSkeleton } from "@/components/vendors/detail-skeleton";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<VendorDetailSkeleton />}>
      <VendorDetailPageClient vendorId={id} />
    </Suspense>
  );
}
