import { Suspense } from "react";
import { ResetPasswordView } from "@/components/auth/reset/client";

export function ResetPasswordServer() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordView />
    </Suspense>
  );
}
