"use client";

import Link from "next/link";
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiCreditCard,
  FiExternalLink,
  FiGlobe,
  FiUploadCloud
} from "react-icons/fi";

type SettingsData = {
  title: string;
  description: string;
  general: {
    platformName: string;
    supportEmail: string;
    brandIdentity: {
      logoData?: string;
      note: string;
      cta: string;
    };
  };
  commission: {
    globalRate: string;
    categoryRate: string;
    categoryLabel: string;
  };
  legal: {
    terms: string;
    privacy: string;
    gdpr: string;
    gdprStatus: string;
  };
  admin: {
    name: string;
    email: string;
    avatar?: string;
  };
};

const panelClass =
  "rounded-[18px] border border-[#dfe4ee] bg-white px-4 py-4 shadow-[0_8px_26px_rgba(15,23,42,0.04)] sm:px-5";
const inputClass =
  "h-11 w-full rounded-[10px] border border-[#d6dce8] bg-white px-3 text-[13px] text-[#27324a] outline-none transition focus:border-[#25408f]";

function SectionBadge({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#18233c]">
      <span className="grid h-4 w-4 place-items-center text-[#24408d]">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-medium text-[#56647f]">{children}</label>;
}

export function SettingsView({ data }: { data: SettingsData }) {
  const [platformName, setPlatformName] = useState(data.general.platformName);
  const [supportEmail, setSupportEmail] = useState(data.general.supportEmail);
  const [brandLogoData, setBrandLogoData] = useState(data.general.brandIdentity.logoData ?? "");
  const [globalRate, setGlobalRate] = useState(data.commission.globalRate);
  const [categoryRate, setCategoryRate] = useState(data.commission.categoryRate);
  const [adminName, setAdminName] = useState(data.admin.name);
  const [adminEmail, setAdminEmail] = useState(data.admin.email);
  const [adminAvatar, setAdminAvatar] = useState(data.admin.avatar ?? "");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const generalSnapshot = useRef({
    platformName: data.general.platformName,
    supportEmail: data.general.supportEmail,
    logoData: data.general.brandIdentity.logoData ?? ""
  });
  const profileSnapshot = useRef({
    name: data.admin.name,
    email: data.admin.email,
    avatar: data.admin.avatar ?? ""
  });
  const commissionSnapshot = useRef({
    globalRate: data.commission.globalRate,
    categoryRate: data.commission.categoryRate
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile");
        if (res.ok) {
          const profileData = await res.json();
          if (profileData && profileData.admin) {
            setAdminName(profileData.admin.name);
            setAdminEmail(profileData.admin.email);
            setAdminAvatar(profileData.admin.avatar ?? "");
            profileSnapshot.current = {
              name: profileData.admin.name,
              email: profileData.admin.email,
              avatar: profileData.admin.avatar ?? ""
            };
          }
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      }
    };
    loadProfile();
  }, []);

  const persistSettings = async (payload: Partial<SettingsData>, successMessage: string) => {
    setSaveStatus("Saving...");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setSaveStatus("Update failed");
      setTimeout(() => setSaveStatus(null), 2200);
      return false;
    }

    setSaveStatus(successMessage);
    setTimeout(() => setSaveStatus(null), 1800);
    return true;
  };

  const commitGeneralSettings = async () => {
    if (
      platformName === generalSnapshot.current.platformName &&
      supportEmail === generalSnapshot.current.supportEmail &&
      brandLogoData === generalSnapshot.current.logoData
    ) {
      return;
    }

    const ok = await persistSettings(
      {
        general: {
          platformName,
          supportEmail,
          brandIdentity: {
            logoData: brandLogoData,
            note: data.general.brandIdentity.note,
            cta: data.general.brandIdentity.cta
          }
        }
      },
      "General settings updated"
    );

    if (ok) {
      generalSnapshot.current = {
        platformName,
        supportEmail,
        logoData: brandLogoData
      };
    }
  };

  const commitCommissionSettings = async () => {
    if (
      globalRate === commissionSnapshot.current.globalRate &&
      categoryRate === commissionSnapshot.current.categoryRate
    ) {
      return;
    }

    const ok = await persistSettings(
      {
        commission: {
          globalRate,
          categoryRate,
          categoryLabel: data.commission.categoryLabel
        }
      },
      "Commission settings updated"
    );

    if (ok) {
      commissionSnapshot.current = {
        globalRate,
        categoryRate
      };
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBrandLogoData(result);
      const ok = await persistSettings(
        {
          general: {
            platformName,
            supportEmail,
            brandIdentity: {
              logoData: result,
              note: data.general.brandIdentity.note,
              cta: data.general.brandIdentity.cta
            }
          }
        },
        "Brand identity updated"
      );

      if (ok) {
        generalSnapshot.current = {
          platformName,
          supportEmail,
          logoData: result
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setAdminAvatar(previewUrl);
    setAvatarBroken(false);
    setProfileError(null);
    setProfileStatus("Profile image ready to save");
  };

  const handleProfileSave = async () => {
    setProfileStatus(null);
    setProfileError(null);

    const hasProfileChanges =
      adminName !== profileSnapshot.current.name ||
      adminEmail !== profileSnapshot.current.email;
    const hasAvatarChange = pendingAvatarFile !== null;

    if (!hasProfileChanges && !hasAvatarChange) {
      return;
    }

    let avatarUrl = profileSnapshot.current.avatar;
    setProfileStatus("Saving profile...");

    if (pendingAvatarFile) {
      const formData = new FormData();
      formData.append("file", pendingAvatarFile);

      const uploadResponse = await fetch("/api/settings/profile/avatar", {
        method: "POST",
        body: formData
      });
      const uploadPayload = (await uploadResponse.json().catch(() => ({}))) as {
        avatar?: string;
        profile_image_url?: string;
        detail?: string;
      };

      if (!uploadResponse.ok) {
        setProfileStatus(null);
        setProfileError(uploadPayload.detail ?? "Failed to upload profile image.");
        return;
      }

      avatarUrl = uploadPayload.avatar ?? uploadPayload.profile_image_url ?? avatarUrl;
    }

    const profileResponse = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin: {
          name: adminName,
          email: adminEmail,
          avatar: avatarUrl
        }
      })
    });
    const profilePayload = (await profileResponse.json().catch(() => ({}))) as {
      admin?: { name?: string; email?: string; avatar?: string };
      detail?: string;
    };

    if (!profileResponse.ok) {
      setProfileStatus(null);
      setProfileError(profilePayload.detail ?? "Failed to save profile.");
      return;
    }

    const savedAdmin = profilePayload.admin ?? {};
    const nextName = savedAdmin.name ?? adminName;
    const nextEmail = savedAdmin.email ?? adminEmail;
    const nextAvatar = savedAdmin.avatar ?? avatarUrl;

    setAdminName(nextName);
    setAdminEmail(nextEmail);
    setAdminAvatar(nextAvatar);
    setPendingAvatarFile(null);
    setProfileError(null);
    setProfileStatus("Profile updated");
    profileSnapshot.current = {
      name: nextName,
      email: nextEmail,
      avatar: nextAvatar
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("admin-profile-updated", {
          detail: { name: nextName, email: nextEmail, avatar: nextAvatar }
        })
      );
    }
    setTimeout(() => setProfileStatus(null), 1800);
  };

  const handlePasswordUpdate = async () => {
    setPasswordStatus(null);
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    const response = await fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.admin.email,
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      setPasswordError("Current password is incorrect.");
      return;
    }

    setPasswordError(null);
    setPasswordStatus("Password updated");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordStatus(null), 1800);
  };

  const initials = adminName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="space-y-5 pb-6 pt-2">
      <header className="flex flex-col gap-2">
        <div>
          <h2 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-[#18233c] sm:text-[32px]">
            {data.title}
          </h2>
          <p className="m-0 mt-1 text-[13px] text-[#74819a]">{data.description}</p>
        </div>
        {saveStatus && <p className="m-0 text-[12px] font-medium text-[#24408d]">{saveStatus}</p>}
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_290px]">
        <div className="space-y-4">
          <section className={panelClass}>
            <SectionBadge icon={<FiGlobe size={13} />}>General Settings</SectionBadge>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Platform Name</FieldLabel>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(event) => setPlatformName(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Support Email</FieldLabel>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(event) => setSupportEmail(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Brand Identity</FieldLabel>
                <div className="flex min-h-[124px] gap-3 rounded-[14px] border border-dashed border-[#cfd7e5] bg-[#fafbfd] px-3 py-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-[#d8e0eb] bg-white">
                    {brandLogoData ? (
                      <img src={brandLogoData} alt="Brand mark" className="h-12 w-12 object-contain" />
                    ) : (
                      <FiUploadCloud size={18} className="text-[#24408d]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="m-0 text-[11px] leading-5 text-[#8a96ad]">{data.general.brandIdentity.note}</p>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-3 w-fit bg-transparent p-0 text-[12px] font-semibold text-[#24408d]"
                    >
                      {data.general.brandIdentity.cta}
                    </button>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={commitGeneralSettings}
                className="h-10 rounded-[10px] bg-[#24408d] px-4 text-[12px] font-semibold text-white shadow-[0_12px_28px_rgba(36,64,141,0.18)]"
              >
                Save General Settings
              </button>
            </div>
          </section>

          <section className={panelClass}>
            <SectionBadge icon={<FiCreditCard size={13} />}>Commission &amp; Revenue</SectionBadge>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Global Service Commission (%)</FieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    value={globalRate}
                    onChange={(event) => setGlobalRate(event.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9aa5ba]">
                    %
                  </span>
                </div>
                <p className="m-0 mt-2 text-[11px] text-[#97a1b4]">
                  Default rate applied to all categories unless specified.
                </p>
              </div>
              <div>
                <FieldLabel>Category-Specific Rate ({data.commission.categoryLabel})</FieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    value={categoryRate}
                    onChange={(event) => setCategoryRate(event.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9aa5ba]">
                    %
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={commitCommissionSettings}
                className="h-10 rounded-[10px] bg-[#24408d] px-4 text-[12px] font-semibold text-white shadow-[0_12px_28px_rgba(36,64,141,0.18)]"
              >
                Save Commission Settings
              </button>
            </div>
          </section>

          <section className={panelClass}>
            <h3 className="m-0 text-[22px] font-medium text-[#1e2b43]">Legal &amp; Compliance</h3>
            <div className="mt-4 overflow-hidden rounded-[14px] border border-[#edf1f6] bg-white">
              <div className="flex items-center justify-between px-3 py-3 text-[13px] text-[#1f2b42]">
                <span>{data.legal.terms}</span>
                <Link
                  href="/settings/legal-content?tab=terms"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#24408d]"
                >
                  Edit <FiExternalLink size={12} />
                </Link>
              </div>
              <div className="h-px bg-[#edf1f6]" />
              <div className="flex items-center justify-between px-3 py-3 text-[13px] text-[#1f2b42]">
                <span>{data.legal.privacy}</span>
                <Link
                  href="/settings/legal-content?tab=privacy"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#24408d]"
                >
                  Edit <FiExternalLink size={12} />
                </Link>
              </div>
              <div className="h-px bg-[#edf1f6]" />
              <div className="flex items-center justify-between px-3 py-3 text-[13px] text-[#1f2b42]">
                <span>{data.legal.gdpr}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#dff7e8] px-3 py-1 text-[11px] font-semibold text-[#24895a]">
                  <FiCheck size={11} />
                  {data.legal.gdprStatus}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right sidebar: Profile + Password ─────────────────── */}
        <div className="space-y-5">

        {/* ── Admin Profile Panel ────────────────────────────────── */}
        <aside className={`${panelClass} h-fit`}>
          <h3 className="m-0 text-[20px] font-semibold text-[#1e2b43]">Admin Profile</h3>
          <p className="m-0 mt-0.5 text-[12px] text-[#8a96ad]">Update your name, email, and profile photo.</p>

          {/* Avatar */}
          <div className="mt-5 flex flex-col items-center text-center">
            <div className="relative grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,#49a2ff_0%,#1f4db6_55%,#14306b_100%)] text-[24px] font-semibold text-white">
              {adminAvatar && !avatarBroken ? (
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-3 text-[12px] font-semibold text-[#24408d] cursor-pointer"
            >
              Change Profile Image
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            {profileStatus && profileStatus === "Profile image ready to save" && (
              <p className="m-0 mt-2 text-[11px] text-[#24408d]">{profileStatus}</p>
            )}
          </div>

          {/* Name & Email */}
          <div className="mt-5 space-y-3">
            <div>
              <FieldLabel>Admin Name</FieldLabel>
              <input
                type="text"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Admin Email</FieldLabel>
              <input
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {(profileError || (profileStatus && profileStatus !== "Profile image ready to save")) && (
            <p className={`m-0 mt-3 text-[12px] ${profileError ? "text-[#d44a4a]" : "text-[#24408d]"}`}>
              {profileError ?? profileStatus}
            </p>
          )}

          <button
            type="button"
            onClick={handleProfileSave}
            className="mt-4 h-11 w-full rounded-[8px] bg-[#24408d] text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(36,64,141,0.18)] cursor-pointer hover:bg-[#1c3372] transition-colors"
          >
            Save Profile Changes
          </button>
        </aside>

        {/* ── Change Password Panel ───────────────────────────────── */}
        <aside className={`${panelClass} h-fit`}>
          <h3 className="m-0 text-[20px] font-semibold text-[#1e2b43]">Change Password</h3>
          <p className="m-0 mt-0.5 text-[12px] text-[#8a96ad]">Enter your current password then set a new one.</p>

          <div className="mt-5 space-y-3">
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClass}
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <FieldLabel>Confirm New Password</FieldLabel>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClass}
                placeholder="Repeat new password"
              />
            </div>
          </div>

          {(passwordError || passwordStatus) && (
            <p className={`m-0 mt-3 text-[12px] ${passwordError ? "text-[#d44a4a]" : "text-[#1da862]"}`}>
              {passwordError ?? passwordStatus}
            </p>
          )}

          <button
            type="button"
            onClick={handlePasswordUpdate}
            className="mt-4 h-11 w-full rounded-[8px] border border-[#24408d] bg-white text-[13px] font-semibold text-[#24408d] cursor-pointer hover:bg-[#f0f4ff] transition-colors"
          >
            Update Password
          </button>
        </aside>

        </div>{/* end right sidebar */}
      </div>
    </section>
  );
}
