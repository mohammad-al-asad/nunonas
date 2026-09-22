"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  DollarSign,
  Gamepad,
  Image as ImageIcon,
  Info,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  uploadVendorFile,
  vendorGetRoom,
  vendorUpdateRoom,
} from "@/lib/vendor-api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";

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

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = String(params.roomId ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    maxGuests: "2 Guests",
    bedType: "King Size",
    numberOfBeds: "1",
    description: "",
    basePrice: "0",
    weekendPrice: "0",
    discount: "0",
    taxIncluded: true,
    activeStatus: true,
    totalInventory: "1",
    minStay: "1",
    maxStay: "30",
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [baseline, setBaseline] = useState("");
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const hasUnsavedChanges = Boolean(baseline) && baseline !== JSON.stringify({ formData, selectedAmenities, images });
  useUnsavedChanges(hasUnsavedChanges && !isSubmitting);

  useEffect(() => {
    void (async () => {
      try {
        const room = await vendorGetRoom(roomId);
        const nextFormData = {
          name: String(room.name ?? ""),
          size: String(room.size_sqm ?? ""),
          maxGuests: `${Number(room.max_guests ?? 2)} Guests`,
          bedType: String(room.bed_type ?? "King Size"),
          numberOfBeds: String(room.number_of_beds ?? 1),
          description: String(room.description ?? ""),
          basePrice: String(room.base_price ?? 0),
          weekendPrice: String(room.weekend_price ?? room.base_price ?? 0),
          discount: String(room.default_discount_percent ?? 0),
          taxIncluded: Boolean(room.tax_included ?? true),
          activeStatus: Boolean(room.active_status ?? room.available ?? true),
          totalInventory: String(room.inventory_count ?? 1),
          minStay: String(room.min_stay_nights ?? 1),
          maxStay: String(room.max_stay_nights ?? 30),
        };
        const nextAmenities = Array.isArray(room.amenities) ? room.amenities.map((item) => String(item)) : [];
        const nextImages = Array.isArray(room.images) ? room.images.map((item) => String(item)) : [];
        setFormData(nextFormData);
        setSelectedAmenities(nextAmenities);
        setImages(nextImages);
        setBaseline(JSON.stringify({ formData: nextFormData, selectedAmenities: nextAmenities, images: nextImages }));
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to load room.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [roomId]);

  const handleFileSelection = async (files: FileList | null) => {
    if (!files) {
      return;
    }
    for (const file of Array.from(files)) {
      try {
        const uploadedUrl = await uploadVendorFile(file);
        setImages((prev) => [...prev, uploadedUrl]);
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to upload image.");
      }
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity],
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setStatusMessage("Room name is required.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      await vendorUpdateRoom(roomId, {
        name: formData.name,
        size_sqm: parseInt(formData.size, 10) || 0,
        max_guests: parseInt(formData.maxGuests.replace(/\D/g, ""), 10) || 1,
        bed_type: formData.bedType,
        number_of_beds: parseInt(formData.numberOfBeds, 10) || 1,
        description: formData.description,
        base_price: parseFloat(formData.basePrice) || 0,
        weekend_price: parseFloat(formData.weekendPrice) || 0,
        default_discount_percent: parseFloat(formData.discount) || 0,
        tax_included: formData.taxIncluded,
        amenities: selectedAmenities,
        images,
        inventory_count: parseInt(formData.totalInventory, 10) || 1,
        min_stay_nights: parseInt(formData.minStay, 10) || 1,
        max_stay_nights: parseInt(formData.maxStay, 10) || 30,
        active_status: formData.activeStatus,
      });
      router.push("/hotel-services");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="text-sm font-bold text-slate-400">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50/50 px-4 py-5 md:px-8 md:py-8">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={(event) => void handleFileSelection(event.target.files)}
      />

      <div className="mx-auto w-full max-w-[1440px] space-y-8">
        {statusMessage ? <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p> : null}

        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => hasUnsavedChanges ? setDiscardConfirmOpen(true) : router.push("/hotel-services")}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:text-[#1e2a5e]"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className="flex items-center gap-3 rounded-2xl bg-[#1e2a5e] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#1e2a5e]/20 transition-all hover:bg-[#1a234d] disabled:bg-slate-400 disabled:shadow-none"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? "Saving..." : "Update Room"}
          </button>
        </div>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#3b82f6]">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
              Basic Information
            </h2>
          </div>
          <div className="space-y-8 p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Room name" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
              <input name="size" value={formData.size} onChange={handleInputChange} placeholder="Room size (sqm)" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <select name="maxGuests" value={formData.maxGuests} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50">
                <option>1 Guests</option>
                <option>2 Guests</option>
                <option>3 Guests</option>
                <option>4 Guests</option>
                <option>5 Guests</option>
              </select>
              <input name="bedType" value={formData.bedType} onChange={handleInputChange} placeholder="Bed type" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
              <input name="numberOfBeds" value={formData.numberOfBeds} onChange={handleInputChange} placeholder="Number of beds" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            </div>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="Room description" className="w-full resize-none rounded-[28px] border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Pricing & Stay Rules</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 p-10 md:grid-cols-3">
            <input name="basePrice" value={formData.basePrice} onChange={handleInputChange} placeholder="Base price" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            <input name="weekendPrice" value={formData.weekendPrice} onChange={handleInputChange} placeholder="Weekend price" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            <input name="discount" value={formData.discount} onChange={handleInputChange} placeholder="Discount %" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700">
              Tax included
              <input
                type="checkbox"
                checked={formData.taxIncluded}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    taxIncluded: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-[#1e2a5e]"
              />
            </label>
            <input name="totalInventory" value={formData.totalInventory} onChange={handleInputChange} placeholder="Inventory count" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            <input name="minStay" value={formData.minStay} onChange={handleInputChange} placeholder="Min stay nights" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
            <input name="maxStay" value={formData.maxStay} onChange={handleInputChange} placeholder="Max stay nights" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Gamepad className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Amenities</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 p-10 md:grid-cols-4">
            {AMENITIES_OPTIONS.map((amenity) => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  "group flex items-center gap-3 rounded-[28px] border p-5 text-left transition-all",
                  selectedAmenities.includes(amenity)
                    ? "border-[#1e2a5e]/20 bg-slate-50"
                    : "border-slate-50 hover:border-slate-100",
                )}
              >
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all", selectedAmenities.includes(amenity) ? "border-[#1e2a5e] bg-[#1e2a5e]" : "border-slate-200")}>
                  {selectedAmenities.includes(amenity) ? <Plus className="h-3 w-3 rotate-45 text-white" /> : null}
                </div>
                <span className={cn("text-xs font-bold", selectedAmenities.includes(amenity) ? "text-slate-800" : "text-slate-400 group-hover:text-slate-500")}>{amenity}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Room Images</h2>
          </div>
          <div className="space-y-10 p-10">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragActive(false);
                void handleFileSelection(event.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center space-y-6 rounded-[40px] border-4 border-dashed p-20 transition-all group",
                isDragActive
                  ? "border-[#1e2a5e] bg-slate-50"
                  : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/30",
              )}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-blue-50 text-[#3b82f6] transition-transform group-hover:scale-110">
                <Upload className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="mb-2 text-xl font-black tracking-tight text-slate-800">Upload new room photos</h3>
                <p className="text-sm font-bold text-slate-400">Add or replace room imagery for guests.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {images.map((src, index) => (
                <div key={`${src}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-[32px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Room preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => removeImage(index)} className="rounded-2xl bg-white p-3 text-rose-500 transition-transform hover:scale-110">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={discardConfirmOpen}
        title="Discard room changes?"
        message="Your unsaved room details, amenities, and image changes will be lost."
        confirmLabel="Discard changes"
        destructive
        onClose={() => setDiscardConfirmOpen(false)}
        onConfirm={() => router.push("/hotel-services")}
      />
    </div>
  );
}
