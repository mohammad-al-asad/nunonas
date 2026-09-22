"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, MapPin, FileText, Upload, ChevronDown } from "lucide-react";

type RegisterFormData = {
  businessName: string;
  category: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  website: string;
  description: string;
  tradeLicenseNumber: string;
  agreeToTerms: boolean;
};

type ApiErrorResponse = {
  detail?: string | { msg?: string }[] | null;
  message?: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_AUTH_API_BASE?.trim() || "").replace(/\/+$/, "");

function getApiBaseUrl(): string {
  return API_BASE_URL;
}

const initialFormData: RegisterFormData = {
  businessName: "",
  category: "Hotel",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  website: "",
  description: "",
  tradeLicenseNumber: "",
  agreeToTerms: false,
};

const textFieldNames = new Set<keyof Omit<RegisterFormData, "agreeToTerms">>([
  "businessName",
  "category",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "address",
  "city",
  "website",
  "description",
  "tradeLicenseNumber",
]);

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
      return parsed.detail[0].msg;
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return error.message || fallback;
  }

  return fallback;
}

function validateRegisterForm(formData: RegisterFormData) {
  if (formData.businessName.trim().length < 2) {
    return "Business name must be at least 2 characters.";
  }

  if (!formData.email.trim()) {
    return "Email address is required.";
  }

  if (formData.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (formData.address.trim().length < 5) {
    return "Address must be at least 5 characters.";
  }

  if (formData.city.trim().length < 2) {
    return "City must be at least 2 characters.";
  }

  if (formData.description.trim().length < 10) {
    return "Business description must be at least 10 characters.";
  }

  if (formData.tradeLicenseNumber.trim().length < 4) {
    return "Trade license number must be at least 4 characters.";
  }

  return null;
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

async function uploadRegistrationDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/vendor/auth/upload-document`, {
    method: "POST",
    body: formData,
  });

  const result = (await response.json()) as {
    url?: string;
    detail?: string | { msg?: string }[];
    message?: string;
  };

  if (!response.ok || !result.url) {
    throw new Error(
      JSON.stringify({
        detail:
          typeof result.detail === "string"
            ? result.detail
            : result.message || "Failed to upload file.",
      }),
    );
  }

  return result.url;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeLicenseDocumentName, setTradeLicenseDocumentName] = useState("");
  const [ownerIdDocumentName, setOwnerIdDocumentName] = useState("");
  const [tradeLicenseDocumentUrl, setTradeLicenseDocumentUrl] = useState("");
  const [ownerIdDocumentUrl, setOwnerIdDocumentUrl] = useState("");
  const [isUploadingTradeLicense, setIsUploadingTradeLicense] = useState(false);
  const [isUploadingOwnerId, setIsUploadingOwnerId] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name } = e.target;

    setSubmitMessage("");

    if (name === "agreeToTerms" && e.target instanceof HTMLInputElement) {
      const inputEl = e.target;
      setFormData((prev) => ({ ...prev, agreeToTerms: inputEl.checked }));
      return;
    }

    if (!textFieldNames.has(name as keyof Omit<RegisterFormData, "agreeToTerms">)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: e.target.value,
    }));
  };

  const handleFileChange =
    (field: "tradeLicenseDocument" | "ownerIdDocument") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      setSubmitMessage("");

      if (field === "tradeLicenseDocument") {
        setTradeLicenseDocumentName(file.name);
        setTradeLicenseDocumentUrl("");
        setIsUploadingTradeLicense(true);
      } else {
        setOwnerIdDocumentName(file.name);
        setOwnerIdDocumentUrl("");
        setIsUploadingOwnerId(true);
      }

      try {
        const uploadedUrl = await uploadRegistrationDocument(file);

        if (field === "tradeLicenseDocument") {
          setTradeLicenseDocumentUrl(uploadedUrl);
          return;
        }

        setOwnerIdDocumentUrl(uploadedUrl);
      } catch (error) {
        if (field === "tradeLicenseDocument") {
          setTradeLicenseDocumentName("");
        } else {
          setOwnerIdDocumentName("");
        }

        setSubmitMessage(
          getErrorMessage(error, "Failed to upload the selected file."),
        );
      } finally {
        if (field === "tradeLicenseDocument") {
          setIsUploadingTradeLicense(false);
        } else {
          setIsUploadingOwnerId(false);
        }
      }
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateRegisterForm(formData);

    if (validationError) {
      setSubmitMessage(validationError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitMessage("Passwords do not match.");
      return;
    }

    if (!formData.agreeToTerms) {
      setSubmitMessage("You must accept the terms to continue.");
      return;
    }

    if (isUploadingTradeLicense || isUploadingOwnerId) {
      setSubmitMessage("Please wait for the document uploads to finish.");
      return;
    }

    if (!tradeLicenseDocumentUrl || !ownerIdDocumentUrl) {
      setSubmitMessage("Upload both verification documents before continuing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const requestCodeResult = await postJson<{
        validation_code?: string | null;
      }>("/vendor/auth/register/request-code", {
        email_or_phone: formData.email.trim(),
      });
      sessionStorage.setItem(
        "pending_vendor_registration",
        JSON.stringify({
          business_name: formData.businessName.trim(),
          owner_full_name: formData.businessName.trim(),
          email_or_phone: formData.email.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim(),
          city: formData.city.trim(),
          website: formData.website.trim() || null,
          business_description: formData.description.trim(),
          trade_license_number: formData.tradeLicenseNumber.trim(),
          trade_license_document_url: tradeLicenseDocumentUrl,
          owner_manager_id_document_url: ownerIdDocumentUrl,
          terms_accepted: formData.agreeToTerms,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          debug_code: requestCodeResult.validation_code ?? null,
        }),
      );
      router.push(
        `/auth/verify-otp?mode=register&contact=${encodeURIComponent(formData.email.trim())}`,
      );
    } catch (error) {
      setSubmitMessage(getErrorMessage(error, "Registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-[800px] flex items-center justify-between mb-12">
        <div className="h-10 w-10 bg-[#1e2a5e] rounded-xl flex items-center justify-center">
          <div className="h-5 w-5 bg-white rounded-sm transform rotate-45" />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-500">
            Already have an account?
          </span>
          <Link
            href="/auth/login"
            className="bg-[#1e2a5e] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#1e2a5e]/20 hover:bg-[#1a2552] transition-all"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="w-full max-w-[800px] space-y-12">
        <div className="text-left">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Register Your Business
          </h1>
          <p className="text-base text-slate-400 mt-2 font-medium">
            Join our platform and reach more customers with our enterprise
            tools.
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#1e2a5e]">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Services"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 appearance-none text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all cursor-pointer"
                  >
                    <option>Hotel</option>
                    <option>Restaurant</option>
                    <option>Spa</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="business@example.com"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="********"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="********"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#1e2a5e]">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Business Details
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Business Way"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.yourbusiness.com"
                    className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Business Description
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your services..."
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all resize-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#1e2a5e]">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Verification</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                  Trade License Number
                </label>
                <input
                  type="text"
                  name="tradeLicenseNumber"
                  value={formData.tradeLicenseNumber}
                  onChange={handleInputChange}
                  placeholder="TX-12345678"
                  className="w-full bg-[#fdf8f8] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e2a5e]/5 focus:border-[#1e2a5e]/20 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label className="space-y-4 block">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                    Trade License Document
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange("tradeLicenseDocument")}
                    className="sr-only"
                  />
                  <span className="border-2 border-dashed border-slate-100 rounded-[28px] p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/30 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <span className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#1e2a5e] shadow-sm transition-colors">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                      {isUploadingTradeLicense
                        ? "Uploading..."
                        : tradeLicenseDocumentUrl
                          ? tradeLicenseDocumentName || "Uploaded"
                          : "Upload PDF or JPG"}
                    </span>
                  </span>
                </label>
                <label className="space-y-4 block">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest block ml-1">
                    Owner/Manager ID
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange("ownerIdDocument")}
                    className="sr-only"
                  />
                  <span className="border-2 border-dashed border-slate-100 rounded-[28px] p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/30 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <span className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#1e2a5e] shadow-sm transition-colors">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                      {isUploadingOwnerId
                        ? "Uploading..."
                        : ownerIdDocumentUrl
                          ? ownerIdDocumentName || "Uploaded"
                          : "Upload Passport/ID"}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group px-2">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="h-5 w-5 rounded-lg border-2 border-slate-200 text-[#1e2a5e] focus:ring-[#1e2a5e] cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-500">
                I agree to the{" "}
                <Link href="#" className="text-[#1e2a5e] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-[#1e2a5e] hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {submitMessage ? (
              <p className="text-sm font-bold text-[#1e2a5e] px-2">
                {submitMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1e2a5e] hover:bg-[#1a2552] disabled:opacity-60 text-white py-5 rounded-[24px] text-lg font-bold shadow-2xl shadow-[#1e2a5e]/30 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-400">
                Need help?{" "}
                <Link href="#" className="text-[#1e2a5e] hover:underline">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
