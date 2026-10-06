import { Suspense } from "react";
import { VendorsManagementViewServer } from "@/components/vendors/server";
import VendorsPageSkeleton from "./loading";

export default function VendorsPage() {
  return (
    <Suspense fallback={<VendorsPageSkeleton />}>
      <VendorsManagementViewServer />
    </Suspense>
  );
}
