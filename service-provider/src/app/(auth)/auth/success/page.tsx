"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="mb-8 p-4">
            <Check className="h-16 w-16 text-[#1e2a5e] stroke-[4]" />
          </div>

          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
            Password Changed!
          </h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10 max-w-[280px]">
            Your password has been successfully updated. You can now access your
            dashboard.
          </p>

          {/* Back to Dashboard Button */}
          <Link href="/dashboard" className="block w-full">
            <button
              type="button"
              className="w-full bg-[#1e2a5e] hover:bg-[#1a2552] text-white py-4 rounded-2xl text-base font-bold shadow-xl shadow-[#1e2a5e]/20 transition-all active:scale-[0.98]"
            >
              Continue to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
