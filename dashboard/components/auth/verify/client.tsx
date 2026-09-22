"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyCode, requestReset } from "@/components/auth/auth-client";

const codeLength = 6;

export function VerifyCodeView() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [values, setValues] = useState<string[]>(Array(codeLength).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => values.join(""), [values]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...values];
    next[index] = value;
    setValues(next);
    if (value && index < codeLength - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (code.length !== codeLength) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    const result = await verifyCode(email, code);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Invalid code.");
      return;
    }
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  const resend = async () => {
    await requestReset(email);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl bg-white px-6 py-6 text-center shadow-sm">
      <h2 className="m-0 text-[16px] font-semibold text-[#1d2a43]">Verify Code</h2>
      <p className="m-0 mt-1 text-[10px] text-[#8b96ad]">
        We sent OTP code to your email
        <br />
        <span className="text-[#1f2d46]">{email}</span>
      </p>

      <div className="mt-4 flex items-center justify-center gap-2">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            value={value}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            maxLength={1}
            className={`h-10 w-10 rounded-lg border text-center text-[14px] font-semibold ${
              value ? "border-[#1f3d8f]" : "border-[#e6ecf7]"
            }`}
          />
        ))}
      </div>

      {error && <p className="m-0 mt-3 text-[11px] text-[#dc2626]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-[#1f3d8f] py-2 text-[12px] font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Next"}
      </button>

      <p className="m-0 mt-3 text-[10px] text-[#8b96ad]">
        Don&apos;t receive OTP?{" "}
        <button type="button" onClick={resend} className="text-[#d64545]">
          Resend again
        </button>
      </p>

      <button type="button" onClick={() => router.push("/login")} className="mt-3 flex w-full items-center justify-center gap-2 text-[11px] text-[#1f2d46]">
        <span>←</span> Back to Login
      </button>
    </form>
  );
}
