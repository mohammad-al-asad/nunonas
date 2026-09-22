"use client";

import React from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Enter your email to reset password
          </p>
        </div>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
              Email
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e2a5e] transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                placeholder="Enter email"
                className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="space-y-6 pt-4">
            <Link href="/auth/verify-otp" className="block w-full">
              <button
                type="button"
                className="w-full bg-[#1e2a5e] hover:bg-[#1a2552] text-white py-4 rounded-2xl text-base font-bold shadow-xl shadow-[#1e2a5e]/20 transition-all active:scale-[0.98]"
              >
                Next
              </button>
            </Link>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
