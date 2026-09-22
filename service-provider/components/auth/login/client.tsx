"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { login } from "@/components/auth/auth-client";

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/dashboard";
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
    router.replace(nextUrl);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[16px] border border-[#d9d9d9] bg-white px-4 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:px-4"
    >
      <div className="text-center">
        <h2 className="text-[30px] font-bold tracking-tight text-black">Welcome Back!</h2>
        <p className="mt-1 text-[14px] text-[#555555]">To login, enter your email assress</p>
      </div>

      <div className="mt-5 space-y-6">
        <div>
          <label className="block text-[15px] font-semibold text-black">Email</label>
          <div className="mt-2 flex items-center gap-3 rounded-[14px] border border-[#ece6e8] bg-[#fbf7f8] px-4 py-3">
            <FiMail size={18} className="text-[#444444]" />
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-0 bg-transparent text-[15px] text-[#1f1f1f] outline-none placeholder:text-[#7e7e7e]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[15px] font-semibold text-black">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-[14px] border border-[#ece6e8] bg-[#fbf7f8] px-4 py-3">
            <FiLock size={18} className="text-[#444444]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-0 bg-transparent text-[15px] text-[#1f1f1f] outline-none placeholder:text-[#7e7e7e]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1 text-[#444444]"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <div className="mt-3 flex justify-end">
            <Link href="/forgot-password" className="text-[15px] font-semibold text-[#de5a39]">
            Forgot Password?
            </Link>
          </div>
        </div>

        {error ? <p className="m-0 text-sm text-[#b91c1c]">{error}</p> : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 flex w-full items-center justify-center rounded-[12px] bg-[#2f4799] py-3 text-[18px] font-semibold text-white transition hover:bg-[#273d88] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="mt-4 text-center">
        <Link href="/auth/register" className="text-[15px] font-semibold text-[#2f4799]">
          Create business account
        </Link>
      </div>
    </form>
  );
}
