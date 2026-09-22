"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import {
  Upload,
  Image as ImageIcon,
  Info,
  Check,
  X,
  Waves,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import {
  uploadVendorFile,
  vendorDeleteAsset,
  vendorJson,
  vendorListAssets,
} from "@/lib/vendor-api";

interface UploadedFile {
  id: string;
  name: string;
  previewUrl: string;
  assetUrl: string;
  type: "menu" | "gallery";
  status: "uploading" | "uploaded";
  persisted?: boolean;
}

export default function SpaServicesPage() {
  const [menuFiles, setMenuFiles] = useState<UploadedFile[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<UploadedFile[]>([]);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "menu" | "gallery";
  } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const menuInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const hasUnsavedChanges = [...menuFiles, ...galleryFiles].some((file) => !file.persisted);
  useUnsavedChanges(hasUnsavedChanges && !isSaving);

  const refreshAssets = useCallback(async () => {
    try {
      const [menuResponse, galleryResponse] = await Promise.all([
        vendorListAssets("menu", "spa"),
        vendorListAssets("gallery", "spa"),
      ]);

      const mapAsset = (
        row: Record<string, unknown>,
        type: "menu" | "gallery",
      ): UploadedFile => ({
        id: String(row.id ?? row._id ?? ""),
        name: String(row.file_name ?? row.name ?? `${type} asset`),
        previewUrl: String(row.asset_url ?? row.url ?? ""),
        assetUrl: String(row.asset_url ?? row.url ?? ""),
        type,
        status: "uploaded",
        persisted: true,
      });

      setMenuFiles((menuResponse.items ?? []).map((row) => mapAsset(row, "menu")));
      setGalleryFiles((galleryResponse.items ?? []).map((row) => mapAsset(row, "gallery")));
    } catch (error) {
      setStatusMessage({
        text: error instanceof Error ? error.message : "Failed to load spa assets.",
        type: "error",
      });
    }
  }, []);

  useEffect(() => {
    void refreshAssets();
  }, [refreshAssets]);

  // Auto-dismiss status message after 5 seconds
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const processFiles = async (files: FileList | File[], type: "menu" | "gallery") => {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const pendingFile: UploadedFile = {
        id,
        name: file.name,
        previewUrl,
        assetUrl: "",
        type,
        status: "uploading",
        persisted: false,
      };

      if (type === "menu") {
        setMenuFiles((prev) => [...prev, pendingFile]);
      } else {
        setGalleryFiles((prev) => [...prev, pendingFile]);
      }

      try {
        const assetUrl = await uploadVendorFile(file);
        const applyUpdate = (rows: UploadedFile[]) =>
          rows.map((row) =>
            row.id === id ? { ...row, assetUrl, status: "uploaded" as const } : row,
          );

        if (type === "menu") {
          setMenuFiles(applyUpdate);
        } else {
          setGalleryFiles(applyUpdate);
        }
      } catch (error) {
        URL.revokeObjectURL(previewUrl);
        setStatusMessage({
          text: error instanceof Error ? error.message : "Failed to upload file.",
          type: "error",
        });

        if (type === "menu") {
          setMenuFiles((prev) => prev.filter((row) => row.id !== id));
        } else {
          setGalleryFiles((prev) => prev.filter((row) => row.id !== id));
        }
      }
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "menu" | "gallery",
  ) => {
    const files = e.target.files;
    if (files) void processFiles(files, type);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent, type: "menu" | "gallery") => {
    e.preventDefault();
    if (type === "menu") setIsDraggingMenu(true);
    else setIsDraggingGallery(true);
  };

  const handleDragLeave = (type: "menu" | "gallery") => {
    if (type === "menu") setIsDraggingMenu(false);
    else setIsDraggingGallery(false);
  };

  const handleDrop = (e: React.DragEvent, type: "menu" | "gallery") => {
    e.preventDefault();
    handleDragLeave(type);
    const files = e.dataTransfer.files;
    if (files) void processFiles(files, type);
  };

  const removeFile = async (id: string, type: "menu" | "gallery") => {
    const rows = type === "menu" ? menuFiles : galleryFiles;
    const target = rows.find((file) => file.id === id);

    if (target?.persisted) {
      setDeleteBusy(true);
      try {
        await vendorDeleteAsset(id);
        await refreshAssets();
        setStatusMessage({ text: "Spa asset deleted successfully.", type: "success" });
        return true;
      } catch (error) {
        setStatusMessage({
          text: error instanceof Error ? error.message : "Failed to delete spa asset.",
          type: "error",
        });
        return false;
      } finally {
        setDeleteBusy(false);
      }
    }

    // If it's a pending (unsaved) file, remove from local state immediately
    if (type === "menu") {
      setMenuFiles((prev) => {
        const removed = prev.find((f) => f.id === id);
        if (removed?.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(removed.previewUrl);
        }
        return prev.filter((f) => f.id !== id);
      });
    } else {
      setGalleryFiles((prev) => {
        const removed = prev.find((f) => f.id === id);
        if (removed?.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(removed.previewUrl);
        }
        return prev.filter((f) => f.id !== id);
      });
    }
    return true;
  };

  const requestRemoveFile = (id: string, type: "menu" | "gallery") => {
    const rows = type === "menu" ? menuFiles : galleryFiles;
    const target = rows.find((file) => file.id === id);

    if (target?.persisted) {
      setDeleteTarget({ id, name: target.name, type });
      return;
    }

    // Unsaved files can be removed immediately without modal
    void removeFile(id, type);
  };

  const discardUnsavedFiles = () => {
    for (const file of [...menuFiles, ...galleryFiles]) {
      if (!file.persisted && file.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(file.previewUrl);
      }
    }
    setMenuFiles((current) => current.filter((file) => file.persisted));
    setGalleryFiles((current) => current.filter((file) => file.persisted));
    setDiscardConfirmOpen(false);
    setStatusMessage({ text: "Unsaved uploads discarded.", type: "success" });
  };

  const handleSave = async () => {
    const pendingFiles = [...menuFiles, ...galleryFiles].filter(
      (file) => !file.persisted,
    );

    if (!pendingFiles.length) {
      setStatusMessage({ text: "All spa assets are already saved.", type: "success" });
      return;
    }

    if (pendingFiles.some((file) => file.status === "uploading")) {
      setStatusMessage({ text: "Please wait for uploads to finish.", type: "error" });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await Promise.all(
        pendingFiles.map((file) =>
          vendorJson(
            "/vendor/menu-services/assets",
            "POST",
            {
              asset_url: file.assetUrl,
              asset_type: file.type,
              service_type: "spa",
              file_name: file.name,
              mime_type: null,
            },
          ),
        ),
      );

      // Clean up object URLs
      pendingFiles.forEach((file) => {
        if (file.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });

      // Refresh to load real database IDs
      await refreshAssets();
      setStatusMessage({ text: "Spa assets saved successfully.", type: "success" });
    } catch (error) {
      setStatusMessage({
        text: error instanceof Error ? error.message : "Failed to save spa assets.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Spa / Services" />

      <main className="flex-1 p-6 md:p-10 pb-32">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Status Message Notification */}
          {statusMessage ? (
            <div
              className={cn(
                "p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all shadow-sm border",
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200",
              )}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Spa Menu Upload Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-8">
                <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 mb-4">
                  <Waves className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Spa Menu Upload
                </h3>
                <p className="text-sm text-slate-400">
                  Upload photos or PDFs of your spa treatments and packages.
                </p>
              </div>

              <div
                onClick={() => menuInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, "menu")}
                onDragLeave={() => handleDragLeave("menu")}
                onDrop={(e) => handleDrop(e, "menu")}
                className={cn(
                  "h-[220px] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                  isDraggingMenu
                    ? "bg-sky-50 border-sky-500 scale-[1.01]"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-sky-500/50",
                )}
              >
                <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    Click or drag to upload
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                    Supports JPG, PNG, PDF
                  </p>
                </div>
                <input
                  type="file"
                  ref={menuInputRef}
                  onChange={(e) => handleFileSelect(e, "menu")}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                />
              </div>

              {/* Menu Previews */}
              {menuFiles.length > 0 && (
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {menuFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50"
                    >
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-md p-2">
                        <p className="text-[9px] font-medium text-white truncate">
                          {file.name}
                        </p>
                        {!file.persisted && (
                          <span className="text-[8px] font-bold text-amber-300 uppercase tracking-wider">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestRemoveFile(file.id, "menu");
                        }}
                        className="absolute top-2 right-2 h-7 w-7 bg-slate-900/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Delete asset"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spa Gallery Upload Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-8">
                <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 mb-4">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Spa Gallery Upload
                </h3>
                <p className="text-sm text-slate-400">
                  Showcase your treatment rooms, pools, and relaxation areas.
                </p>
              </div>

              <div
                onClick={() => galleryInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, "gallery")}
                onDragLeave={() => handleDragLeave("gallery")}
                onDrop={(e) => handleDrop(e, "gallery")}
                className={cn(
                  "h-[220px] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                  isDraggingGallery
                    ? "bg-sky-50 border-sky-500 scale-[1.01]"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-sky-500/50",
                )}
              >
                <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    Add gallery photos
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                    High resolution recommended
                  </p>
                </div>
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={(e) => handleFileSelect(e, "gallery")}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
              </div>

              {/* Gallery Previews */}
              {galleryFiles.length > 0 && (
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galleryFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50"
                    >
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-md p-2">
                        <p className="text-[9px] font-medium text-white truncate">
                          {file.name}
                        </p>
                        {!file.persisted && (
                          <span className="text-[8px] font-bold text-amber-300 uppercase tracking-wider">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestRemoveFile(file.id, "gallery");
                        }}
                        className="absolute top-2 right-2 h-7 w-7 bg-slate-900/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Delete asset"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-slate-100/50 rounded-[32px] p-8 border border-slate-100 flex gap-6">
            <div className="h-10 w-10 bg-sky-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-800">
                Spa Upload Guidelines
              </h4>
              <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-4xl">
                Ensure spa treatment names are clearly visible on the menu.
                Gallery photos should highlight the tranquility and cleanliness
                of your facilities. Use calm, high-quality imagery.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 z-50 transition-all">
        <div className="max-w-[1400px] mx-auto flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                setDiscardConfirmOpen(true);
              } else {
                setStatusMessage({ text: "There are no unsaved changes.", type: "success" });
              }
            }}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              "px-8 py-3.5 rounded-2xl text-sm font-bold transition-all",
              hasUnsavedChanges && !isSaving
                ? "text-slate-600 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                : "text-slate-300 cursor-not-allowed opacity-60",
            )}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              "px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl transition-all",
              hasUnsavedChanges && !isSaving
                ? "bg-[#1e2a5e] hover:bg-[#1a2552] text-white shadow-slate-900/10 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none",
            )}
          >
            <Check className="h-4 w-4" />
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "All Saved"}
          </button>
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this spa asset?"
        message={`"${deleteTarget?.name ?? "This asset"}" will be permanently removed from customer-facing content.`}
        confirmLabel="Delete asset"
        destructive
        busy={deleteBusy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const deleted = await removeFile(deleteTarget.id, deleteTarget.type);
          if (deleted) {
            setDeleteTarget(null);
          }
        }}
      />

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={discardConfirmOpen}
        title="Discard unsaved uploads?"
        message="Newly selected spa files will be removed from this form."
        confirmLabel="Discard uploads"
        destructive
        onClose={() => setDiscardConfirmOpen(false)}
        onConfirm={discardUnsavedFiles}
      />
    </div>
  );
}
