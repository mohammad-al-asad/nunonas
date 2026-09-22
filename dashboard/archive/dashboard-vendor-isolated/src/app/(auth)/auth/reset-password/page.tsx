"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Set new password
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Set a new password and continue your journey
          </p>
        </div>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          {/* New Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
              Set Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Type a strong password"
                className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 pr-14 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
              Confirm password
            </label>
            <div className="relative group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-type password"
                className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 pr-14 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <Link href="/auth/success" className="block w-full pt-4">
            <button
              type="button"
              className="w-full bg-[#1e2a5e] hover:bg-[#1a2552] text-white py-4 rounded-2xl text-base font-bold shadow-xl shadow-[#1e2a5e]/20 transition-all active:scale-[0.98]"
            >
              Continue
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}
