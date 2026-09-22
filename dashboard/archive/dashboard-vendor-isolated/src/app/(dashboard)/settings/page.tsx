"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  User,
  Save,
  ChevronRight,
} from "lucide-react";
import {
  vendorGetGeneralSettings,
  vendorUpdateGeneralSettings,
  vendorUpdatePassword,
  vendorGetProfileSettings,
  vendorUpdateProfileSettings,
  vendorUpdateNotificationSettings,
} from "@/lib/vendor-api";

type SettingsTab = "profile" | "notifications" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    business_name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
  });

  // Security
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Notification prefs
  const [notifForm, setNotifForm] = useState({
    new_booking: true,
    booking_cancellation: true,
    new_review: true,
    platform_updates: false,
  });

  useEffect(() => {
    vendorGetProfileSettings()
      .then((data) => {
        const d = data as Record<string, unknown>;
        setProfileForm({
          business_name: (d.business_name ?? d.name ?? "") as string,
          phone: (d.phone ?? "") as string,
          email: (d.email ?? "") as string,
          address: (d.address ?? "") as string,
          description: (d.description ?? "") as string,
        });
      })
      .catch(() => { /* no profile yet */ });
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await vendorUpdateProfileSettings(profileForm as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Passwords don't match.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    try {
      setSaving(true);
      await vendorUpdatePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setSaved(true);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setPasswordError((err as Error).message ?? "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await vendorUpdateNotificationSettings(notifForm as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn("Failed to save notification settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Business Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Password & Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Settings" />

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 bg-white border border-slate-100 rounded-2xl p-2 shadow-sm">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-1 justify-center ${
                  activeTab === id
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Business Profile</h2>
                  <p className="text-sm text-slate-400">Update your business information visible to customers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "business_name", label: "Business Name", type: "text" },
                    { key: "phone", label: "Phone", type: "tel" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "address", label: "Address", type: "text" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                      <input
                        type={type}
                        value={profileForm[key as keyof typeof profileForm]}
                        onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 resize-none transition"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-slate-400">Choose which updates you want to receive.</p>
                </div>
                {[
                  { key: "new_booking", label: "New Bookings", description: "Alert when a new booking is made" },
                  { key: "booking_cancellation", label: "Booking Cancellations", description: "Alert when a booking is cancelled" },
                  { key: "new_review", label: "New Reviews", description: "Alert when a customer leaves a review" },
                  { key: "platform_updates", label: "Platform Updates", description: "News and product updates from Nunonas" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                    </div>
                    <button
                      onClick={() => setNotifForm((f) => ({ ...f, [key]: !f[key as keyof typeof notifForm] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifForm[key as keyof typeof notifForm] ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          notifForm[key as keyof typeof notifForm] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Preferences"}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Password & Security</h2>
                  <p className="text-sm text-slate-400">Update your password to keep your account secure.</p>
                </div>
                {passwordError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-4">
                  {[
                    { key: "old_password", label: "Current Password" },
                    { key: "new_password", label: "New Password" },
                    { key: "confirm_password", label: "Confirm New Password" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                      <input
                        type="password"
                        value={passwordForm[key as keyof typeof passwordForm]}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 transition"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Shield className="h-4 w-4" />
                  {saving ? "Updating…" : saved ? "Updated!" : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
