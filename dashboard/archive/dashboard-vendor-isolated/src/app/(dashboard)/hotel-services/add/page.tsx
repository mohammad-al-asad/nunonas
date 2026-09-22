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
  Gamepad,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { uploadVendorFile, vendorCreateRoom } from "@/lib/vendor-api";

const AMENITIES_OPTIONS = [
  "Free WiFi",
  "Air Conditioning",
  "Smart TV",
  "Mini Bar",
  "Coffee Maker",
  "Safe Box",
  "Balcony",
  "Work Desk",
];

export default function AddRoomPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    maxGuests: "2 Guests",
    bedType: "King Size",
    numberOfBeds: "1",
    description: "",
    basePrice: "299.00",
    weekendPrice: "349.00",
    discount: "0",
    taxIncluded: true,
    activeStatus: true,
    totalInventory: "12",
    minStay: "1",
    maxStay: "30",
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Free WiFi",
    "Air Conditioning",
    "Smart TV",
    "Balcony",
  ]);

  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?w=400&q=80",
  ]);

  const [isDragActive, setIsDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    void handleFileSelection(e.dataTransfer.files);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
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
      alert("Please enter a room name");
      return;
    }

    setIsSubmitting(true);

    try {
      const roomPayload = {
        name: formData.name,
        size_sqm: parseInt(formData.size) || 30,
        max_guests: parseInt(formData.maxGuests.replace(/\D/g, "")) || 2,
        bed_type: formData.bedType,
        number_of_beds: parseInt(formData.numberOfBeds) || 1,
        description: formData.description,
        base_price: parseFloat(formData.basePrice) || 0,
        weekend_price: parseFloat(formData.weekendPrice) || 0,
        default_discount_percent: parseFloat(formData.discount) || 0,
        amenities: selectedAmenities,
        images: images,
        inventory_count: parseInt(formData.totalInventory) || 1,
        min_stay_nights: parseInt(formData.minStay) || 1,
        max_stay_nights: parseInt(formData.maxStay) || 30,
        active_status: formData.activeStatus,
      };

      await vendorCreateRoom(roomPayload);
      setIsSubmitting(false);
      router.push("/hotel-services");
    } catch (err) {
      setIsSubmitting(false);
      alert("Failed to save room: " + (err instanceof Error ? err.message : String(err)));
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
                Add New Room
              </h1>
              <p className="text-slate-400 font-bold mt-1 text-sm">
                Configure a new room type for your property inventory.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
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
              {isSubmitting ? "Saving..." : "Save Room"}
            </button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="grid grid-cols-1 gap-10 pb-20">
          {/* Basic Information */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-sky-50 rounded-xl text-[#3b82f6]">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                Basic Information
              </h2>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Deluxe Ocean View Suite"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Room Size (sqm)
                  </label>
                  <input
                    type="number"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="45"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Max Guests
                  </label>
                  <select
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all appearance-none"
                  >
                    <option>2 Guests</option>
                    <option>3 Guests</option>
                    <option>4 Guests</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Bed Type
                  </label>
                  <select
                    name="bedType"
                    value={formData.bedType}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all appearance-none"
                  >
                    <option>King Size</option>
                    <option>Queen Size</option>
                    <option>Twin Beds</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Number of Beds
                  </label>
                  <input
                    type="number"
                    name="numberOfBeds"
                    value={formData.numberOfBeds}
                    onChange={handleInputChange}
                    placeholder="1"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
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
                  placeholder="Describe the room features, view, and unique selling points..."
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[28px] text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-blue-50 rounded-xl text-blue-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                  Pricing
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Tax Included
                </span>
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      taxIncluded: !prev.taxIncluded,
                    }))
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors",
                    formData.taxIncluded ? "bg-[#1e2a5e]" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      formData.taxIncluded ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Base Price per Night ($)
                </label>
                <input
                  type="text"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  placeholder="299.00"
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Weekend Price ($)
                </label>
                <input
                  type="text"
                  name="weekendPrice"
                  value={formData.weekendPrice}
                  onChange={handleInputChange}
                  placeholder="349.00"
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Default Discount (%)
                </label>
                <input
                  type="text"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Amenities */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-indigo-50 rounded-xl text-indigo-600">
                  <Gamepad className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                  Amenities
                </h2>
              </div>
              <button className="text-xs font-black text-[#3b82f6] uppercase tracking-widest hover:underline">
                + Add custom
              </button>
            </div>
            <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    "flex items-center gap-3 p-5 rounded-[28px] border transition-all text-left group",
                    selectedAmenities.includes(amenity)
                      ? "bg-slate-50 border-[#1e2a5e]/20"
                      : "border-slate-50 hover:border-slate-100",
                  )}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedAmenities.includes(amenity)
                        ? "bg-[#1e2a5e] border-[#1e2a5e]"
                        : "border-slate-200",
                    )}
                  >
                    {selectedAmenities.includes(amenity) && (
                      <Plus className="h-3 w-3 text-white rotate-45" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold transition-colors",
                      selectedAmenities.includes(amenity)
                        ? "text-slate-800"
                        : "text-slate-400 group-hover:text-slate-500",
                    )}
                  >
                    {amenity}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Room Images */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-emerald-50 rounded-xl text-emerald-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                Room Images
              </h2>
            </div>
            <div className="p-10 space-y-10">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                    Drag and drop photos here
                  </h3>
                  <p className="text-sm font-bold text-slate-400">
                    Supported formats: JPG, PNG, WEBP. Max size 5MB.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Browse Files
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] rounded-[32px] overflow-hidden group"
                  >
                    <img
                      src={src}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => removeImage(i)}
                        className="p-3 bg-white text-rose-500 rounded-2xl hover:scale-110 transition-transform"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    {i === 0 && (
                      <span className="absolute top-4 left-4 bg-[#1e2a5e] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                        COVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Inventory & Policy */}
          <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-10">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-amber-50 rounded-xl text-amber-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                  Inventory & Policy
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Status
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
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Total Inventory (Count)
                  </label>
                  <input
                    type="number"
                    name="totalInventory"
                    value={formData.totalInventory}
                    onChange={handleInputChange}
                    placeholder="12"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Number of rooms of this type available.
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Min. Stay (Nights)
                  </label>
                  <input
                    type="number"
                    name="minStay"
                    value={formData.minStay}
                    onChange={handleInputChange}
                    placeholder="1"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    Max. Stay (Nights)
                  </label>
                  <input
                    type="number"
                    name="maxStay"
                    value={formData.maxStay}
                    onChange={handleInputChange}
                    placeholder="30"
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
