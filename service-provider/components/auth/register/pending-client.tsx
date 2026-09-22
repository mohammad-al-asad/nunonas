"use client";

import { useRouter } from "next/navigation";

export function RegisterPendingView() {
  const router = useRouter();

  return (
    <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3ea] text-[14px] font-semibold text-[#c85b3b]">
        OK
      </div>
      <h2 className="m-0 mt-3 text-[18px] font-semibold text-[#2e1e19]">Registration Submitted</h2>
      <p className="m-0 mt-2 text-[12px] leading-5 text-[#866c62]">
        Your service provider account was created successfully and is now pending admin approval.
      </p>
      <p className="m-0 mt-1 text-[11px] text-[#a08a80]">
        You will be able to log in after the admin approves your account.
      </p>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-4 w-full rounded-lg bg-[#c85b3b] py-2 text-[12px] font-semibold text-white"
      >
        Back To Login
      </button>
    </div>
  );
}
