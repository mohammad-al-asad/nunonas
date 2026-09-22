"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requestReset, verifyCode } from "@/components/auth/auth-client";

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
  category?: string;
  categories?: string[];
  event_types?: string[] | null;
  venue_capacity?: number | null;
  ticket_pricing_type?: string | null;
  business_location_label?: string | null;
  equipment_availability?: string[] | null;
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

const REGISTER_DRAFT_STORAGE_KEY = "vendor_registration_draft";
const OTP_SLOT_COUNT = 6;

function getApiBaseUrl(): string {
  return "/api";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message) as ApiErrorResponse;

    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      if (parsed.detail === "Invalid phone number format." || parsed.detail === "phone must be a phone number.") {
        return "Phone number must be 8 to 15 digits and can start with +.";
      }
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

      if (fieldName === "owner_full_name") {
        return "Owner full name must be at least 2 characters.";
      }

      if (fieldName === "phone") {
        return "Phone number must be 8 to 15 digits and can start with +.";
      }

      if (fieldName === "signup_token") {
        return "Verification session expired. Please request a new code.";
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

function normalizePhone(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/[\s().-]/g, "").trim();
  if (!normalized) {
    return null;
  }
  return /^\+?\d{8,15}$/.test(normalized) ? normalized : null;
}

function normalizePendingRegistration(pending: PendingVendorRegistration) {
  return {
    ...pending,
    phone: normalizePhone(pending.phone),
  };
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
  const email = searchParams.get("email") ?? "";
  const contact = searchParams.get("contact") ?? "your email";
  const [otp, setOtp] = useState(() => Array(OTP_SLOT_COUNT).fill(""));
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
    value = value.replace(/\D/g, "");
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, otp.length);
    if (!pasted) {
      return;
    }

    e.preventDefault();
    const nextOtp = Array(otp.length).fill("");
    pasted.split("").forEach((digit, index) => {
      nextOtp[index] = digit;
    });
    setOtp(nextOtp);

    const focusIndex = Math.min(pasted.length, otp.length) - 1;
    if (focusIndex >= 0) {
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = otp.join("").trim();

    if (code.length !== otp.length) {
      setMessage("Enter the complete verification code.");
      return;
    }

    if (mode !== "register") {
      const result = await verifyCode(email, code);
      if (!result.ok) {
        setMessage(result.message ?? "Invalid verification code.");
        return;
      }
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
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
      const pending = normalizePendingRegistration(JSON.parse(pendingRaw) as PendingVendorRegistration);
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

      await postJson<{
        access_token: string;
        vendor?: { status?: string };
      }>("/vendor/auth/register", {
        ...pending,
        signup_token: verifyResult.signup_token,
      });

      sessionStorage.removeItem("pending_vendor_registration");
      sessionStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);
      router.push("/auth/registration-submitted");
    } catch (error) {
      setMessage(getErrorMessage(error, "Verification failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (mode !== "register") {
      if (!email) {
        setMessage("Email address is required.");
        return;
      }

      setIsResending(true);
      setMessage("");
      try {
        const result = await requestReset(email);
        if (!result.ok) {
          setMessage(result.message ?? "Failed to resend the code.");
          return;
        }
        setOtp(Array(OTP_SLOT_COUNT).fill(""));
        inputRefs.current[0]?.focus();
        setMessage("A new verification code has been sent.");
      } finally {
        setIsResending(false);
      }
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
          ...normalizePendingRegistration(pending),
          debug_code: resendResult.validation_code ?? null,
        }),
      );
      setOtp(Array(OTP_SLOT_COUNT).fill(""));
      inputRefs.current[0]?.focus();
      setMessage("A new verification code has been sent.");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to resend the code."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-[540px] bg-white rounded-[24px] p-10 md:p-14 shadow-2xl shadow-slate-100/70 border border-slate-100/60 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-black text-slate-950 tracking-tight">
            Verify Code
          </h1>
          <p className="mt-3 text-xs text-slate-400 font-bold leading-relaxed max-w-[340px] mx-auto">
            We Sent OTP code to your email <br />
            <span className="text-xs text-slate-800 font-black block my-1 truncate">
              {mode === "register" ? contact : email || contact}
            </span>{" "}
            Enter the code below to verify
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleVerify}>
          <div className="flex justify-center gap-5">
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
                onPaste={handlePaste}
                className="w-18 h-18 bg-white border border-slate-200 rounded-2xl text-center text-3xl font-black text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all"
              />
            ))}
          </div>

          <div className="space-y-5">
            {message ? (
              <p className="text-xs font-bold text-red-500 text-center">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full bg-[#1b2554] hover:bg-[#151c3f] text-white py-4.5 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
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
                  className="text-[#e26e5a] hover:text-[#d25e4a] transition-colors"
                >
                  {isResending ? "Sending..." : "Resend again"}
                </button>
              </p>

              <Link
                href={mode === "register" ? "/auth/register" : "/auth/login"}
                className="flex items-center justify-center gap-2 pt-2 text-sm font-bold text-slate-800 transition-colors hover:text-slate-950"
              >
                <ArrowLeft className="h-4 w-4 text-slate-800" />
                {mode === "register" ? "Back to Register" : "Back to Login"}
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1e2a5e] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyCodeInner />
    </Suspense>
  );
}
