import { Suspense } from "react";
import { LoginView } from "@/components/auth/login/client";

export function LoginServer() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
