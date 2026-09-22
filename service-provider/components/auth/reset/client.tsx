"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { resetPassword } from "@/components/auth/auth-client";

export function ResetPasswordView() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Reset failed.");
      return;
    }
    router.push("/password-changed");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl bg-white px-6 py-6 shadow-sm">
      <div className="text-center">
        <h2 className="m-0 text-[16px] font-semibold text-[#1d2a43]">Set new password</h2>
        <p className="m-0 mt-1 text-[10px] text-[#8b96ad]">Set a new password and continue your journey</p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-[#1f2d46]">Set Password</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#f0e4e8] bg-[#fff7f7] px-3 py-2">
            <FiLock size={14} className="text-[#8b96ad]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Type a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-0 bg-transparent text-[12px] text-[#1f2d46] outline-none"
              required
            />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-[#8b96ad]">
              {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#1f2d46]">Confirm password</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#f0e4e8] bg-[#fff7f7] px-3 py-2">
            <FiLock size={14} className="text-[#8b96ad]" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-type password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full border-0 bg-transparent text-[12px] text-[#1f2d46] outline-none"
              required
            />
            <button type="button" onClick={() => setShowConfirm((prev) => !prev)} className="text-[#8b96ad]">
              {showConfirm ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          </div>
        </div>

        {error && <p className="m-0 text-[11px] text-[#dc2626]">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-[#1f3d8f] py-2 text-[12px] font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
