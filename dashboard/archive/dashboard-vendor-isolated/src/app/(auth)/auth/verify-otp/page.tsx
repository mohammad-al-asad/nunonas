"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type PendingVendorRegistration = {
  business_name: string;
  owner_full_name: string;
  email_or_phone: string;
  phone: string | null;
  address: string;
  city: string;
  website: string | null;
  business_description: string;
  trade_license_number: string;
  trade_license_document_url: string;
  owner_manager_id_document_url: string;
  terms_accepted: boolean;
  password: string;
  confirm_password: string;
  debug_code?: string | null;
};

type ApiErrorResponse = {
  detail?:
    | string
    | {
        msg?: string;
        loc?: (string | number)[];
      }[]
    | null;
  message?: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || "").replace(/\/+$/, "");

function getApiBaseUrl(): string {
  return API_BASE_URL;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message) as ApiErrorResponse;

    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }

    if (Array.isArray(parsed.detail) && parsed.detail[0]?.msg) {
      const firstError = parsed.detail[0];
      const fieldName = firstError.loc?.[firstError.loc.length - 1];

      if (fieldName === "business_description") {
        return "Business description must be at least 10 characters.";
      }

      if (fieldName === "business_name") {
        return "Business name must be at least 2 characters.";
      }

      if (fieldName === "address") {
        return "Address must be at least 5 characters.";
      }

      if (fieldName === "city") {
        return "City must be at least 2 characters.";
      }

      if (fieldName === "trade_license_number") {
        return "Trade license number must be at least 4 characters.";
      }

      if (fieldName === "password" || fieldName === "confirm_password") {
        return "Password must be at least 8 characters.";
      }

      return firstError.msg ?? fallback;
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return error.message || fallback;
  }

  return fallback;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function VerifyCodeInner() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const contact = searchParams.get("contact") ?? "your email";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (mode !== "register") {
      return;
    }

    const pending = sessionStorage.getItem("pending_vendor_registration");

    if (!pending) {
      router.replace("/auth/register");
      return;
    }

    try {
      JSON.parse(pending) as PendingVendorRegistration;
    } catch {
      sessionStorage.removeItem("pending_vendor_registration");
      router.replace("/auth/register");
    }
  }, [mode, router]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (mode !== "register") {
      router.push("/auth/reset-password");
      return;
    }

    const code = otp.join("").trim();

    if (code.length !== otp.length) {
      setMessage("Enter the complete verification code.");
      return;
    }

    const pendingRaw = sessionStorage.getItem("pending_vendor_registration");

    if (!pendingRaw) {
      setMessage("Registration session expired. Please start again.");
      router.push("/auth/register");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const pending = JSON.parse(pendingRaw) as PendingVendorRegistration;
      const verifyResult = await postJson<{ signup_token?: string | null }>(
        "/vendor/auth/register/verify-code",
        {
          email_or_phone: pending.email_or_phone,
          validation_code: code,
        },
      );

      if (!verifyResult.signup_token) {
        throw new Error(
          JSON.stringify({ detail: "Signup token was not returned." }),
        );
      }

      const registerResult = await postJson<{
        access_token: string;
        refresh_token?: string;
        session_token?: string;
        vendor?: { status?: string };
      }>("/vendor/auth/register", {
        ...pending,
        signup_token: verifyResult.signup_token,
      });

      localStorage.setItem("vendor_access_token", registerResult.access_token);
      if (registerResult.refresh_token || registerResult.session_token) {
        localStorage.setItem(
          "vendor_refresh_token",
          registerResult.refresh_token ?? registerResult.session_token ?? "",
        );
      }
      sessionStorage.removeItem("pending_vendor_registration");
      router.push("/dashboard");
    } catch (error) {
      setMessage(getErrorMessage(error, "Verification failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (mode !== "register") {
      return;
    }

    const pendingRaw = sessionStorage.getItem("pending_vendor_registration");

    if (!pendingRaw) {
      router.push("/auth/register");
      return;
    }

    setIsResending(true);
    setMessage("");

    try {
      const pending = JSON.parse(pendingRaw) as PendingVendorRegistration;
      const resendResult = await postJson<{ validation_code?: string | null }>(
        "/vendor/auth/register/request-code",
        {
          email_or_phone: pending.email_or_phone,
        },
      );

      sessionStorage.setItem(
        "pending_vendor_registration",
        JSON.stringify({
          ...pending,
          debug_code: resendResult.validation_code ?? null,
        }),
      );
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setMessage("A new verification code has been sent.");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to resend the code."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-50">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Verify Code
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium leading-relaxed">
            We Sent OTP code to your email <br />
            <span className="text-slate-600 font-bold">
              {contact}
            </span>{" "}
            Enter the code below to verify
          </p>
        </div>

        <form className="space-y-10" onSubmit={handleVerify}>
          <div className="flex justify-center gap-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl text-center text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e] transition-all"
              />
            ))}
          </div>

          <div className="space-y-6">
            {message ? (
              <p className="text-sm font-bold text-[#1e2a5e] text-center">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full bg-[#1e2a5e] hover:bg-[#1a2552] text-white py-4 rounded-2xl text-base font-bold shadow-xl shadow-[#1e2a5e]/20 transition-all active:scale-[0.98] disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Next"}
            </button>

            <div className="text-center space-y-4">
              <p className="text-xs font-bold text-slate-400">
                Don&apos;t receive OTP?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-[#e16b4f] hover:text-[#d15b3f] transition-colors"
                >
                  {isResending ? "Sending..." : "Resend again"}
                </button>
              </p>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors pt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1e2a5e] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyCodeInner />
    </Suspense>
  );
}
