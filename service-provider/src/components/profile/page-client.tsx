"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Camera,
  ChevronRight,
  Globe2,
  Headphones,
  Lock,
  MapPin,
  Trash2,
  Save,
  Settings,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  deleteVendorProfileAvatar,
  uploadVendorProfileAvatar,
  vendorUpdateProfileSettings,
} from "@/lib/vendor-api";
import { buildOnboardingProfilePayload } from "@/lib/vendor-contracts";
import { extractVendorCategories } from "@/lib/vendor-access";
import { vendorQueryKeys } from "@/lib/vendor-queries";

const ONBOARDING_CATEGORIES = [
  "Restaurant",
  "Hotel",
  "Spa",
  "Event",
] as const;

export type ProfileSettingsData = {
  business_name?: string;
  name?: string;
  owner_full_name?: string;
  category?: string;
  categories?: string[];
  phone_number?: string;
  phone?: string;
  email_address?: string;
  email?: string;
  about_business?: string;
  description?: string;
  website?: string;
  office_address?: string;
  address?: string;
  location_label?: string;
  avatar_url?: string;
  profile_image_url?: string;
};

function text(...values: unknown[]) {
  const value = values.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  return typeof value === "string" ? value.trim() : "";
}

function profileCategories(data: ProfileSettingsData) {
  const values = Array.isArray(data.categories)
    ? data.categories
    : [data.category];
  return extractVendorCategories(values).filter((category) => category !== "Happy Hour");
}

export function ProfilePageClient({
  initialData,
}: {
  initialData: ProfileSettingsData;
}) {
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState(() =>
    text(initialData.avatar_url, initialData.profile_image_url),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [onboarding, setOnboarding] = useState(() => ({
    business_name: text(initialData.business_name, initialData.name),
    owner_full_name: text(initialData.owner_full_name),
    email: text(initialData.email_address, initialData.email),
    phone: text(initialData.phone_number, initialData.phone),
    categories: profileCategories(initialData).length
      ? profileCategories(initialData)
      : ["Restaurant"],
  }));

  const businessName = onboarding.business_name || "Business";
  const ownerName = onboarding.owner_full_name || "Owner not provided";
  const address = text(
    initialData.office_address,
    initialData.address,
    initialData.location_label,
    "Location not provided",
  );
  const locationLabel = text(initialData.location_label, address);
  const description = text(
    initialData.about_business,
    initialData.description,
    "No business description has been added.",
  );
  const website = text(initialData.website);
  const categories = onboarding.categories;

  const toggleCategory = (category: string) => {
    setStatusMessage("");
    setOnboarding((current) => {
      const selected = current.categories.includes(category);
      if (selected && current.categories.length === 1) return current;
      return {
        ...current,
        categories: selected
          ? current.categories.filter((item) => item !== category)
          : [...current.categories, category],
      };
    });
  };

  const handleSaveOnboarding = async () => {
    if (!onboarding.business_name.trim()) {
      setStatusMessage("Business name is required.");
      return;
    }
    if (!onboarding.owner_full_name.trim()) {
      setStatusMessage("Owner or contact name is required.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    try {
      await queryClient.cancelQueries({ queryKey: vendorQueryKeys.profile });
      const updated = await vendorUpdateProfileSettings(
        buildOnboardingProfilePayload(onboarding, onboarding.categories),
      );
      queryClient.setQueryData(vendorQueryKeys.profile, updated);
      setStatusMessage("Onboarding details saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to save onboarding details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setStatusMessage("");
    try {
      await queryClient.cancelQueries({ queryKey: vendorQueryKeys.profile });
      const uploadedUrl = await uploadVendorProfileAvatar(file);
      setAvatarUrl(uploadedUrl);
      queryClient.setQueryData(
        vendorQueryKeys.profile,
        (current: Record<string, unknown> | undefined) => ({
          ...(current ?? initialData),
          avatar_url: uploadedUrl,
        }),
      );
      setStatusMessage("Profile image updated.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload profile image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!avatarUrl || uploading) return;
    setUploading(true);
    setStatusMessage("");
    try {
      await deleteVendorProfileAvatar();
      setAvatarUrl("");
      queryClient.setQueryData(
        vendorQueryKeys.profile,
        (current: Record<string, unknown> | undefined) => ({
          ...(current ?? initialData),
          avatar_url: "",
          profile_image_url: "",
        }),
      );
      setStatusMessage("Profile image removed.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to remove profile image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <Header title="Account Profile" />
      <main className="w-full space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-slate-50 bg-slate-100 shadow-sm">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${businessName} profile`}
                    width={96}
                    height={96}
                    sizes="96px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#1e2a5e] text-2xl font-black text-white">
                    {businessName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-4 border-white bg-sky-500 text-white shadow-lg transition hover:bg-sky-600">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleAvatarUpload}
                />
                <Camera className="h-4 w-4" />
              </label>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => void handleAvatarDelete()}
                  disabled={uploading}
                  aria-label="Remove profile image"
                  className="absolute -right-2 top-0 flex h-8 w-8 items-center justify-center rounded-xl border-4 border-white bg-rose-500 text-white shadow transition hover:bg-rose-600 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-500">
                Canonical provider account
              </p>
              <h1 className="mt-1 truncate text-2xl font-black text-slate-900 sm:text-3xl">
                {businessName}
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {ownerName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(categories.length ? categories : ["Category not provided"]).map(
                  (category) => (
                    <span
                      key={category}
                      className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700"
                    >
                      {category}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#263675]"
          >
            <Settings className="h-4 w-4" />
            Edit business settings
          </Link>
        </section>

        {statusMessage ? (
          <p
            role="status"
            className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800"
          >
            {uploading ? "Uploading profile image…" : statusMessage}
          </p>
        ) : uploading ? (
          <p
            role="status"
            className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-800"
          >
            Uploading profile image…
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Onboarding settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Edit the account identity and enabled business modules created
                  during registration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveOnboarding()}
                disabled={saving || uploading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save onboarding"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  key: "business_name",
                  label: "Business name",
                  type: "text",
                  value: onboarding.business_name,
                },
                {
                  key: "owner_full_name",
                  label: "Owner / contact name",
                  type: "text",
                  value: onboarding.owner_full_name,
                },
                {
                  key: "email",
                  label: "Contact email",
                  type: "email",
                  value: onboarding.email,
                },
                {
                  key: "phone",
                  label: "Contact phone",
                  type: "tel",
                  value: onboarding.phone,
                },
              ].map(({ key, label, type, value }) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={value}
                    onChange={(event) =>
                      setOnboarding((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              ))}
            </div>

            <fieldset>
              <legend className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Enabled business modules
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {ONBOARDING_CATEGORIES.map((category) => {
                  const selected = categories.includes(category);
                  return (
                    <label
                      key={category}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                        selected
                          ? "border-sky-300 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-sky-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 accent-sky-500"
                      />
                      {category}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                At least one module must remain enabled. Navigation updates
                immediately after saving.
              </p>
            </fieldset>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Building2 className="h-4 w-4 text-sky-500" />
                    Business profile summary
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Address, website, description, and service details are owned
                    by Business Settings.
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="shrink-0 text-xs font-black text-sky-600 hover:text-sky-700"
                >
                  Edit settings
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Public location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {locationLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Website
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                      {website || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {description}
              </p>
              <p className="mt-3 text-xs text-slate-400">{address}</p>
            </div>
          </section>

          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Account links
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Open the section that owns the information you need to change.
              </p>
            </div>
            {[
              {
                href: "/settings",
                label: "Business settings",
                description: "Profile, services, security, and notifications",
                icon: Settings,
              },
              {
                href: "/profile/support",
                label: "Support center",
                description: "Create and follow support requests",
                icon: Headphones,
              },
              {
                href: "/profile/legal/terms",
                label: "Legal documents",
                description: "Terms and privacy information",
                icon: Lock,
              },
            ].map(({ href, label, description: itemDescription, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-sky-200 hover:bg-sky-50/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-sky-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-800">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {itemDescription}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-sky-500" />
              </Link>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
