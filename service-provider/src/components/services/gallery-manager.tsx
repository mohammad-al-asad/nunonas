"use client";

import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import {
  uploadVendorFile,
  vendorDeleteAsset,
  vendorJson,
  vendorListAssets,
} from "@/lib/vendor-api";

interface PendingPhoto {
  id: string;
  name: string;
  previewUrl: string;
  assetUrl: string;
  status: "uploading" | "uploaded";
}

interface SavedPhoto {
  id: string;
  name: string;
  assetUrl: string;
}

const DESCRIPTIONS = {
  restaurant: "Upload storefront, dining area, food, and ambience photos.",
  spa: "Upload treatment rooms, reception, relaxation areas, and product photos.",
};

/** Upload, publish and delete gallery photos for one service (the app's Gallery tab). */
export function GalleryManager({ serviceType }: { serviceType: "restaurant" | "spa" }) {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SavedPhoto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  useUnsavedChanges(pendingPhotos.length > 0 && !isSaving);

  const refreshPhotos = async () => {
    const gallery = await vendorListAssets("gallery", serviceType);
    setSavedPhotos(
      (gallery.items || []).map((row: Record<string, unknown>) => ({
        id: String(row.id ?? ""),
        name: String(row.file_name ?? row.name ?? "Gallery photo"),
        assetUrl: String(row.asset_url ?? row.url ?? ""),
      })),
    );
  };

  useEffect(() => {
    void (async () => {
      try {
        await refreshPhotos();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to load gallery photos.");
      } finally {
        setIsLoading(false);
      }
    })();
    // refreshPhotos only depends on serviceType.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType]);

  const processFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setStatusMessage(`${file.name} is not a photo. Upload JPG or PNG files.`);
        continue;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setPendingPhotos((prev) => [
        ...prev,
        { id, name: file.name, previewUrl, assetUrl: "", status: "uploading" },
      ]);

      try {
        const assetUrl = await uploadVendorFile(file);
        setPendingPhotos((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, assetUrl, status: "uploaded" as const } : row,
          ),
        );
      } catch (error) {
        URL.revokeObjectURL(previewUrl);
        setStatusMessage(error instanceof Error ? error.message : "Failed to upload image.");
        setPendingPhotos((prev) => prev.filter((row) => row.id !== id));
      }
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      void processFiles(event.dataTransfer.files);
    }
  };

  const removePendingPhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const target = prev.find((row) => row.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const deleteSavedPhoto = async (photo: SavedPhoto) => {
    setDeleteBusy(true);
    try {
      await vendorDeleteAsset(photo.id);
      await refreshPhotos();
      setStatusMessage("Photo deleted.");
      setDeleteTarget(null);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to delete photo.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSave = async () => {
    if (pendingPhotos.length === 0) {
      setStatusMessage("Add at least one photo before saving.");
      return;
    }
    if (pendingPhotos.some((photo) => photo.status === "uploading")) {
      setStatusMessage("Please wait for uploads to finish.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    try {
      await Promise.all(
        pendingPhotos.map((photo) =>
          vendorJson("/vendor/menu-services/assets", "POST", {
            asset_url: photo.assetUrl,
            asset_type: "gallery",
            service_type: serviceType,
            file_name: photo.name,
            mime_type: null,
          }),
        ),
      );
      pendingPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      setPendingPhotos([]);
      await refreshPhotos();
      setStatusMessage("Gallery photos saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save photos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {statusMessage ? (
        <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
      ) : null}

      <section className="flex flex-col rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
        <div className="mb-8">
          <h3 className="mb-2 text-xl font-bold text-slate-800">Gallery Photos</h3>
          <p className="text-sm text-slate-400">{DESCRIPTIONS[serviceType]}</p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed transition-all group",
            isDragging
              ? "scale-[1.01] border-sky-500 bg-sky-50"
              : "border-slate-200 bg-slate-50/50 hover:border-sky-500/50 hover:bg-slate-50",
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-500 shadow-sm transition-transform group-hover:scale-110">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Click or drag to upload</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Supports JPG, PNG
            </p>
          </div>
          <input
            type="file"
            ref={inputRef}
            onChange={(event) => {
              if (event.target.files) void processFiles(event.target.files);
              event.target.value = "";
            }}
            className="hidden"
            accept=".jpg,.jpeg,.png"
            multiple
          />
        </div>

        {pendingPhotos.length > 0 ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Ready To Save
              </h4>
              <span className="text-xs font-bold text-slate-500">{pendingPhotos.length} photos</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {pendingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-2 backdrop-blur-md">
                    <p className="truncate text-[9px] font-medium text-white">{photo.name}</p>
                    <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/70">
                      {photo.status}
                    </p>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      removePendingPhoto(photo.id);
                    }}
                    aria-label={`Remove ${photo.name}`}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-opacity hover:bg-rose-500/80 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => void handleSave()}
                disabled={isSaving || isLoading}
                className="rounded-2xl bg-[#1e2a5e] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#1e2a5e]/20 transition hover:bg-[#1a234d] disabled:bg-slate-400"
              >
                {isSaving ? "Saving Photos..." : "Save Photos"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800">Published Gallery Photos</h3>
            <p className="mt-1 text-sm text-slate-400">
              Customers see these in the Gallery tab of your {serviceType}.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {savedPhotos.length} saved
          </span>
        </div>

        {savedPhotos.length === 0 ? (
          isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading photos">
              {[0, 1, 2].map((index) => (
                <div key={index} className="aspect-[4/3] animate-pulse rounded-[28px] bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-[28px] bg-slate-50 px-6 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-600">No published photos yet</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Photos you upload and save above will appear here and in the app.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50/40"
              >
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.assetUrl} alt={photo.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-700">{photo.name}</p>
                    <a
                      href={photo.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e2a5e]"
                    >
                      Open photo
                    </a>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(photo)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                    aria-label={`Delete ${photo.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this photo?"
        message={`"${deleteTarget?.name ?? "This photo"}" will be removed from your ${serviceType} gallery.`}
        confirmLabel="Delete photo"
        destructive
        busy={deleteBusy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void deleteSavedPhoto(deleteTarget)}
      />
    </>
  );
}
