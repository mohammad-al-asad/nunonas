import { Suspense } from "react";
import { VendorsManagementViewServer } from "@/components/vendors/server";

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1f3d8f] border-t-transparent" />
      </div>
    }>
      <VendorsManagementViewServer />
    </Suspense>
  );
}
