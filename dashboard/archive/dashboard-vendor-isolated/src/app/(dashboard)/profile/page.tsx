"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  Camera,
  Lock,
  Headphones,
  FileText,
  Shield,
  ChevronRight,
  Save,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { uploadVendorFile, vendorJson } from "@/lib/vendor-api";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    businessName: "TechFlow Solutions",
    category: "Retail",
    email: "business@example.com",
    phone: "+1 (555) 000-0000",
    about:
      "TechFlow Solutions is an industry-leading IT consulting firm dedicated to helping businesses leverage technology for sustainable growth. With over 10 years of experience, we provide end-to-end solutions in cloud architecture, network security, and custom software development. Our team of certified professionals ensures your infrastructure is robust, scalable, and secure.",
    contactPhone: "+1 (555) 123-4567",
    contactEmail: "hello@techflow.com",
    website: "https://techflow.com",
    address:
      "123 Innovation Drive, Financial District, San Francisco, CA 94105",
    avatarUrl: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setStatusMessage("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setStatusMessage("");

    try {
      const uploadedUrl = await uploadVendorFile(file);
      setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
      setStatusMessage("Profile image uploaded.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to upload profile image.",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    try {
      await vendorJson("/vendor/settings/profile", "PATCH", {
        business_name: formData.businessName,
        category: formData.category,
        email_address: formData.contactEmail,
        phone_number: formData.contactPhone,
        about_business: formData.about,
        office_address: formData.address,
        website: formData.website,
        map_embed_url: null,
        avatar_url: formData.avatarUrl || null,
      });
      setStatusMessage("Profile settings saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save profile settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Business Profile" />

      <main className="flex-1 p-6 md:p-10 pb-32">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Business Profile
              </h1>
              <p className="text-sm font-bold text-slate-400 mt-1">
                Manage how your business appears to potential clients.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || isUploadingAvatar}
              className="px-8 py-3.5 bg-[#1e2a5e] hover:bg-[#1a234d] disabled:opacity-60 text-white rounded-[24px] text-sm font-black flex items-center gap-2 shadow-xl shadow-[#1e2a5e]/20 transition-all"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {statusMessage ? (
            <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full border-8 border-slate-50 overflow-hidden shadow-inner bg-slate-200">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt="Profile avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col overflow-hidden">
                          <div className="h-1/2 bg-[#f59e0b]" />
                          <div className="h-1/2 bg-[#065f46]" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 h-10 w-10 bg-[#1e2a5e] text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <Camera className="h-5 w-5" />
                    </label>
                  </div>
                  {isUploadingAvatar ? (
                    <p className="text-xs font-bold text-slate-400 mt-4">
                      Uploading profile image...
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700"
                      placeholder="e.g. Acme Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Category
                    </label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700 appearance-none">
                      <option>Retail</option>
                      <option>Restaurant</option>
                      <option>Hotel</option>
                      <option>Spa & Wellness</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700"
                      placeholder="business@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-800 mb-1">
                    About Business
                  </h3>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-[32px] overflow-hidden">
                  <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 text-slate-400">
                    <button className="hover:text-slate-800 font-serif font-black">
                      B
                    </button>
                    <button className="hover:text-slate-800 italic font-serif">
                      I
                    </button>
                    <button className="hover:text-slate-800 text-lg leading-none transition-transform hover:scale-110">
                      •
                    </button>
                    <button className="hover:text-slate-800 text-lg leading-none transition-transform hover:scale-110">
                      ∞
                    </button>
                  </div>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-8 bg-transparent focus:outline-none text-sm font-bold text-slate-500 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Contact & Location */}
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-800 mb-1">
                    Contact & Location
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        Website
                      </label>
                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] transition-all text-sm font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4 font-bold">
                        Office Address
                      </label>
                      <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-[24px]">
                        <p className="text-sm font-bold text-slate-600 leading-relaxed">
                          {formData.address}
                        </p>
                      </div>
                    </div>

                    <div className="relative group rounded-[32px] overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale"
                        alt="Map"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-[#1e2a5e]" />
                      </div>
                      <button className="absolute bottom-4 right-4 px-4 py-2 bg-white text-[10px] font-black text-slate-800 rounded-xl shadow-lg hover:bg-[#1e2a5e] hover:text-white transition-all">
                        Expand Map
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-8">
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-6 px-4">
                  Account Settings
                </h3>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-slate-50/50 border border-slate-50 hover:border-sky-200 hover:bg-white rounded-[24px] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-slate-700">
                        Change Password
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </button>

                  <Link
                    href="/profile/support"
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 border border-slate-50 hover:border-sky-200 hover:bg-white rounded-[24px] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                        <Headphones className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-slate-700">
                        Support
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/profile/legal/terms"
                    className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 rounded-[20px] transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">
                      Terms & Conditions
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/profile/legal/privacy"
                    className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 rounded-[20px] transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">
                      Privacy Policy
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
