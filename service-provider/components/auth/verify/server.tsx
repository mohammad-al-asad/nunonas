import { Suspense } from "react";
import { VerifyCodeView } from "@/components/auth/verify/client";

export function VerifyCodeServer() {
  return (
    <Suspense fallback={null}>
      <VerifyCodeView />
    </Suspense>
  );
}
