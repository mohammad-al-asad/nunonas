"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { login } from "@/components/auth/auth-client";

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Login failed.");
      return;
    }
    router.push(nextUrl);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[24px] border border-white/60 bg-[#0f172a]/92 p-7 shadow-[0_28px_90px_rgba(2,6,23,0.45)] backdrop-blur sm:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#60a5fa] text-[#0f172a] shadow-lg shadow-[#60a5fa]/20">
            <FiLock size={18} />
          </div>
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Admin Console</p>
            <h2 className="m-0 text-[28px] font-black tracking-tight text-white">Welcome Back!</h2>
          </div>
        </div>
        <div className="hidden rounded-full bg-[#172554] px-3 py-1 text-[11px] font-semibold text-[#bfdbfe] sm:block">
          Elevated access
        </div>
      </div>

      <p className="mt-3 max-w-[34ch] text-sm leading-6 text-[#94a3b8]">
        Manage platform settings, moderation, and analytics from the admin workspace.
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#cbd5e1]">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#1e293b] bg-[#111827] px-4 py-3 transition focus-within:border-[#60a5fa]/30 focus-within:bg-[#0b1220] focus-within:shadow-[0_0_0_4px_rgba(96,165,250,0.08)]">
            <FiMail size={16} className="text-[#64748b]" />
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#64748b]"
              required
            />
          </div>
        </div>

        <div>
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#cbd5e1]">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#1e293b] bg-[#111827] px-4 py-3 transition focus-within:border-[#60a5fa]/30 focus-within:bg-[#0b1220] focus-within:shadow-[0_0_0_4px_rgba(96,165,250,0.08)]">
            <FiLock size={16} className="text-[#64748b]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#64748b]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded-full p-1 text-[#64748b] transition hover:bg-white/5 hover:text-white"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-[#7dd3fc] transition hover:text-[#bae6fd]">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="m-0 rounded-xl bg-red-950/60 px-4 py-3 text-sm text-[#fecaca]">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#60a5fa] to-[#2563eb] py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] transition hover:from-[#4f93f0] hover:to-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
