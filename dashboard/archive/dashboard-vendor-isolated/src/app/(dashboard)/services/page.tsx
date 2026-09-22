"use client";

import React, { useState, useRef } from "react";
import { Header } from "@/components/Header";
import {
  Upload,
  Image as ImageIcon,
  Info,
  Check,
  X,
  Plus,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadVendorFile, vendorJson } from "@/lib/vendor-api";

interface UploadedFile {
  id: string;
  name: string;
  previewUrl: string;
  assetUrl: string;
  type: "menu" | "gallery";
  status: "uploading" | "uploaded" | "saving";
}

export default function ServicesPage() {
  const [menuFiles, setMenuFiles] = useState<UploadedFile[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<UploadedFile[]>([]);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const menuInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[], type: "menu" | "gallery") => {
    const fileList = Array.from(files);

    for (const file of fileList) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const pendingFile: UploadedFile = {
        id,
        name: file.name,
        previewUrl,
        assetUrl: "",
        type,
        status: "uploading",
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
        const message =
          error instanceof Error ? error.message : "Failed to upload image.";
        setStatusMessage(message);

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

  const removeFile = (id: string, type: "menu" | "gallery") => {
    if (type === "menu") {
      setMenuFiles((prev) => {
        const target = prev.find((f) => f.id === id);
        if (target) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return prev.filter((f) => f.id !== id);
      });
    } else {
      setGalleryFiles((prev) => {
        const target = prev.find((f) => f.id === id);
        if (target) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return prev.filter((f) => f.id !== id);
      });
    }
  };

  const handleSave = async () => {
    const pendingFiles = [...menuFiles, ...galleryFiles];

    if (pendingFiles.some((file) => file.status === "uploading")) {
      setStatusMessage("Please wait for uploads to finish.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    try {
      await Promise.all(
        pendingFiles.map((file) =>
          vendorJson(
            file.type === "menu"
              ? "/vendor/menu-services/menu-assets"
              : "/vendor/menu-services/gallery-assets",
            "POST",
            {
              asset_url: file.assetUrl,
              file_name: file.name,
              mime_type: null,
            },
          ),
        ),
      );
      setStatusMessage("Assets saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save assets.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Restaurant / Services" />

      <main className="flex-1 p-6 md:p-10 pb-32">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {statusMessage ? (
            <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
          ) : null}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Menu Upload Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Menu Image Upload
                </h3>
                <p className="text-sm text-slate-400">
                  Upload clear photos or PDFs of your menu.
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
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
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
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id, "menu");
                        }}
                        className="absolute top-2 right-2 h-6 w-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Upload Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Gallery Image Upload
                </h3>
                <p className="text-sm text-slate-400">
                  Showcase your ambiance and signature dishes.
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
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id, "gallery");
                        }}
                        className="absolute top-2 right-2 h-6 w-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/80"
                      >
                        <X className="h-3 w-3" />
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
                Upload Guidelines
              </h4>
              <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-4xl">
                For the best results, use images with at least 1920px width.
                Avoid text-heavy photos for the gallery. Menu pages should be
                high contrast for better OCR recognition.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 z-50 transition-all">
        <div className="max-w-[1400px] mx-auto flex items-center justify-end gap-4">
          <button className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3.5 bg-[#1e2a5e] hover:bg-[#1a2552] disabled:opacity-60 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all"
          >
            <Check className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </footer>
    </div>
  );
}
