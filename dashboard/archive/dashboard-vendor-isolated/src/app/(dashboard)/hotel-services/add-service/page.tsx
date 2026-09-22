"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  Info,
  DollarSign,
  Utensils,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { uploadVendorFile, vendorCreateService } from "@/lib/vendor-api";

const SERVICE_CATEGORIES = ["Food", "Laundry", "Cleaning", "Wellness", "Other"];

export default function AddServicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Food",
    price: "25.00",
    deliveryTime: "30-45 MIN",
    description: "",
    activeStatus: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelection = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const uploadedUrl = await uploadVendorFile(file);
        setImages((prev) => [...prev, uploadedUrl]);
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to upload image.",
        );
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      if (newImages[index].startsWith("blob:")) {
        URL.revokeObjectURL(newImages[index]);
      }
      return newImages.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Please enter a service name");
      return;
    }

    setIsSubmitting(true);

    try {
      const servicePayload = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        delivery_time: formData.deliveryTime,
        description: formData.description,
        images: images,
        active_status: formData.activeStatus,
      };

      await vendorCreateService(servicePayload);
      setIsSubmitting(false);
      router.push("/hotel-services");
    } catch (err) {
      setIsSubmitting(false);
      alert("Failed to save service: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 bg-slate-50/50 overflow-x-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={(e) => void handleFileSelection(e.target.files)}
      />

      <div className="max-w-[1000px] mx-auto space-y-10">
        {statusMessage ? (
          <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
        ) : null}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/hotel-services"
              className="h-14 w-14 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-[#1e2a5e] transition-all"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Add Room Service
              </h1>
              <p className="text-slate-400 font-bold mt-1 text-sm">
                Create a new service amenity for your hotel guests.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-3 bg-[#1e2a5e] text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-[#1a234d] transition-all shadow-xl shadow-[#1e2a5e]/20 disabled:bg-slate-400 disabled:shadow-none"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {isSubmitting ? "Saving..." : "Save Service"}
            </button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="grid grid-cols-1 gap-10 pb-20">
          {/* Basic Information */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-sky-50 rounded-xl text-[#3b82f6]">
                <Utensils className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                Service Details
              </h2>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Afternoon High Tea"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all appearance-none"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Price ($)
                  </label>
                  <div className="relative group">
                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#1e2a5e] transition-colors" />
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-16 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Est. Delivery Time
                  </label>
                  <div className="relative group">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#1e2a5e] transition-colors" />
                    <input
                      type="text"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      placeholder="e.g. 20-30 MIN"
                      className="w-full pl-16 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Details about the service, inclusions, or requirements..."
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[28px] text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-emerald-50 rounded-xl text-emerald-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                Service Photos
              </h2>
            </div>
            <div className="p-10 space-y-10">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  void handleFileSelection(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative border-4 border-dashed rounded-[40px] p-20 flex flex-col items-center justify-center space-y-6 transition-all cursor-pointer group",
                  isDragActive
                    ? "border-[#1e2a5e] bg-slate-50"
                    : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/30",
                )}
              >
                <div className="h-20 w-20 flex items-center justify-center bg-blue-50 rounded-[32px] text-[#3b82f6] group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                    Upload service photos
                  </h3>
                  <p className="text-sm font-bold text-slate-400">
                    Show guests what this service looks like.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Browse Files
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {images.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-[32px] overflow-hidden group"
                    >
                      <img
                        src={src}
                        alt="Service preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(i);
                          }}
                          className="p-3 bg-white text-rose-500 rounded-2xl hover:scale-110 transition-transform"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Status */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-10">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-amber-50 rounded-xl text-amber-600">
                  <Info className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                  Service Availability
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Live Status
                </span>
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      activeStatus: !prev.activeStatus,
                    }))
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors",
                    formData.activeStatus ? "bg-[#1e2a5e]" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      formData.activeStatus ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
