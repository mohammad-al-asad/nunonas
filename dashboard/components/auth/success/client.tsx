"use client";

import { useRouter } from "next/navigation";

export function PasswordChangedView() {
  const router = useRouter();
  return (
    <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eefb] text-[14px] font-semibold text-[#1f3d8f]">
        OK
      </div>
      <h2 className="m-0 mt-3 text-[18px] font-semibold text-[#1d2a43]">Password Changed!</h2>
      <p className="m-0 mt-1 text-[11px] text-[#8b96ad]">
        Return to the login page to enter your account with your new password
      </p>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-4 w-full rounded-lg bg-[#1f3d8f] py-2 text-[12px] font-semibold text-white"
      >
        Back To Login
      </button>
    </div>
  );
}
