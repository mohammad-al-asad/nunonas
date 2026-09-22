"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#1e2a5e] rounded-lg flex items-center justify-center">
            <div className="h-4 w-4 bg-white rounded-sm transform rotate-45" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-500">
            Don't have an account?
          </span>
          <Link
            href="/auth/register"
            className="bg-[#1e2a5e] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#1e2a5e]/20 hover:bg-[#1a2552] transition-all"
          >
            Register
          </Link>
        </div>
      </div>

      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            To login, enter your email address
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

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e2a5e] transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 pl-14 pr-14 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
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
            <div className="flex justify-end pr-1">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-bold text-[#e16b4f] hover:text-[#d15b3f] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Login Button */}
          <Link href="/dashboard" className="block w-full">
            <button
              type="submit"
              className="w-full bg-[#1e2a5e] hover:bg-[#1a2552] text-white py-4 rounded-2xl text-base font-bold shadow-xl shadow-[#1e2a5e]/20 transition-all active:scale-[0.98] mt-4"
            >
              Login
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}
