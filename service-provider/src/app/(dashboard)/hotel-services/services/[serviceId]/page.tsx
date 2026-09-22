"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Info,
  Save,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  uploadVendorFile,
  vendorGetService,
  vendorUpdateService,
} from "@/lib/vendor-api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";

const SERVICE_CATEGORIES = ["Food", "Laundry", "Cleaning", "Wellness", "Other"];

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams<{ serviceId: string }>();
  const serviceId = String(params.serviceId ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "Food",
    price: "0",
    deliveryTime: "",
    description: "",
    activeStatus: true,
  });
  const [baseline, setBaseline] = useState("");
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const hasUnsavedChanges = Boolean(baseline) && baseline !== JSON.stringify({ formData, images });
  useUnsavedChanges(hasUnsavedChanges && !isSubmitting);

  useEffect(() => {
    void (async () => {
      try {
        const service = await vendorGetService(serviceId);
        const nextFormData = {
          name: String(service.name ?? ""),
          category: String(service.category ?? "Food"),
          price: String(service.price ?? 0),
          deliveryTime: String(service.delivery_time ?? ""),
          description: String(service.description ?? ""),
          activeStatus: Boolean(service.active_status ?? service.available ?? true),
        };
        const nextImages = Array.isArray(service.images) ? service.images.map((item) => String(item)) : [];
        setFormData(nextFormData);
        setImages(nextImages);
        setBaseline(JSON.stringify({ formData: nextFormData, images: nextImages }));
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to load service.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [serviceId]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setStatusMessage("Service name is required.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      await vendorUpdateService(serviceId, {
        name: formData.name,
        service_type: "hotel",
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        delivery_time: formData.deliveryTime,
        description: formData.description,
        images,
        active_status: formData.activeStatus,
      });
      router.push("/hotel-services");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="text-sm font-bold text-slate-400">Loading service...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50/50 p-4 md:p-10">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={(event) => void handleFileSelection(event.target.files)}
      />

      <div className="mx-auto max-w-[1000px] space-y-10">
        {statusMessage ? <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p> : null}

        <div className="flex items-center justify-between">
          <div>
            <button type="button" onClick={() => hasUnsavedChanges ? setDiscardConfirmOpen(true) : router.push("/hotel-services")} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:text-[#1e2a5e]">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className="flex items-center gap-3 rounded-2xl bg-[#1e2a5e] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#1e2a5e]/20 transition-all hover:bg-[#1a234d] disabled:bg-slate-400 disabled:shadow-none"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? "Saving..." : "Update Service"}
          </button>
        </div>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#3b82f6]">
              <Utensils className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Service Details</h2>
          </div>
          <div className="space-y-8 p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Service name" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50">
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="relative">
                <DollarSign className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                <input name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-4 pl-16 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
              </div>
              <div className="relative">
                <Clock className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                <input name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} placeholder="Delivery time" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-4 pl-16 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
              </div>
            </div>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="Service description" className="w-full resize-none rounded-[28px] border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-50" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Service Availability</h2>
            </div>
            <button
              onClick={() => setFormData((prev) => ({ ...prev, activeStatus: !prev.activeStatus }))}
              className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", formData.activeStatus ? "bg-[#1e2a5e]" : "bg-slate-200")}
            >
              <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", formData.activeStatus ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Service Photos</h2>
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
              className={cn("relative flex cursor-pointer flex-col items-center justify-center space-y-6 rounded-[40px] border-4 border-dashed p-20 transition-all group", isDragActive ? "border-[#1e2a5e] bg-slate-50" : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/30")}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-blue-50 text-[#3b82f6] transition-transform group-hover:scale-110">
                <Upload className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="mb-2 text-xl font-black tracking-tight text-slate-800">Upload service photos</h3>
                <p className="text-sm font-bold text-slate-400">Keep imagery aligned with the current service.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {images.map((src, index) => (
                <div key={`${src}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-[32px]">
                  <img src={src} alt="Service preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="rounded-2xl bg-white p-3 text-rose-500 transition-transform hover:scale-110">
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
        title="Discard service changes?"
        message="Your unsaved service details and image changes will be lost."
        confirmLabel="Discard changes"
        destructive
        onClose={() => setDiscardConfirmOpen(false)}
        onConfirm={() => router.push("/hotel-services")}
      />
    </div>
  );
}
