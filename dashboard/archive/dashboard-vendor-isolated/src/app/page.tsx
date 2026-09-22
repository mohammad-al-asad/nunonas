"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd check auth state here
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
      <div className="animate-pulse text-slate-400 font-medium">Loading...</div>
    </div>
  );
}
