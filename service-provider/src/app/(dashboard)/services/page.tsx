"use client";

import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import {
  FileText,
  Image as ImageIcon,
  Info,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import {
  uploadVendorFile,
  vendorDeleteAsset,
  vendorGetMenuServicesOverview,
  vendorJson,
  vendorListAssets,
} from "@/lib/vendor-api";

type AssetType = "menu" | "gallery";

interface PendingFile {
  id: string;
  name: string;
  previewUrl: string;
  assetUrl: string;
  type: AssetType;
  status: "uploading" | "uploaded";
}

interface SavedAsset {
  id: string;
  name: string;
  assetUrl: string;
  type: AssetType;
}

type OverviewState = {
  totalAssets: number;
  menuAssets: number;
  galleryAssets: number;
};

const INITIAL_OVERVIEW: OverviewState = {
  totalAssets: 0,
  menuAssets: 0,
  galleryAssets: 0,
};

function isPdfFile(nameOrUrl: string) {
  return nameOrUrl.toLowerCase().includes(".pdf");
}

function AssetPreview({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className?: string;
}) {
  if (isPdfFile(name) || isPdfFile(url)) {
    return (
      <div className={cn("flex h-full w-full flex-col items-center justify-center bg-slate-100", className)}>
        <FileText className="h-12 w-12 text-[#1e2a5e]" />
        <span className="mt-3 px-3 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
          PDF Document
        </span>
      </div>
    );
  }

  return <img src={url} alt={name} className={cn("h-full w-full object-cover", className)} />;
}

export default function ServicesPage() {
  const [menuFiles, setMenuFiles] = useState<PendingFile[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<PendingFile[]>([]);
  const [savedMenuAssets, setSavedMenuAssets] = useState<SavedAsset[]>([]);
  const [savedGalleryAssets, setSavedGalleryAssets] = useState<SavedAsset[]>([]);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewState>(INITIAL_OVERVIEW);
  const [deleteTarget, setDeleteTarget] = useState<SavedAsset | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const menuInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const hasUnsavedChanges = menuFiles.length > 0 || galleryFiles.length > 0;
  useUnsavedChanges(hasUnsavedChanges && !isSaving);

  const refreshAssets = async () => {
    const [overviewRes, menuRes, galleryRes] = await Promise.all([
      vendorGetMenuServicesOverview("restaurant"),
      vendorListAssets("menu", "restaurant"),
      vendorListAssets("gallery", "restaurant"),
    ]);

    const nextMenuAssets = (menuRes.items || []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      name: String(row.file_name ?? row.name ?? "Menu Asset"),
      assetUrl: String(row.asset_url ?? row.url ?? ""),
      type: "menu" as const,
    }));

    const nextGalleryAssets = (galleryRes.items || []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      name: String(row.file_name ?? row.name ?? "Gallery Asset"),
      assetUrl: String(row.asset_url ?? row.url ?? ""),
      type: "gallery" as const,
    }));

    setSavedMenuAssets(nextMenuAssets);
    setSavedGalleryAssets(nextGalleryAssets);
    setOverview({
      totalAssets:
        Number(overviewRes.total_assets) || nextMenuAssets.length + nextGalleryAssets.length,
      menuAssets: Number(overviewRes.menu_assets_count) || nextMenuAssets.length,
      galleryAssets: Number(overviewRes.gallery_assets_count) || nextGalleryAssets.length,
    });
  };

  useEffect(() => {
    void (async () => {
      try {
        await refreshAssets();
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to load restaurant assets.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const processFiles = async (files: FileList | File[], type: AssetType) => {
    const fileList = Array.from(files);

    for (const file of fileList) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const pendingFile: PendingFile = {
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
        const applyUpdate = (rows: PendingFile[]) =>
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
    event: React.ChangeEvent<HTMLInputElement>,
    type: AssetType,
  ) => {
    const files = event.target.files;
    if (files) {
      void processFiles(files, type);
    }
  };

  const handleDragOver = (event: React.DragEvent, type: AssetType) => {
    event.preventDefault();
    if (type === "menu") {
      setIsDraggingMenu(true);
    } else {
      setIsDraggingGallery(true);
    }
  };

  const handleDragLeave = (type: AssetType) => {
    if (type === "menu") {
      setIsDraggingMenu(false);
    } else {
      setIsDraggingGallery(false);
    }
  };

  const handleDrop = (event: React.DragEvent, type: AssetType) => {
    event.preventDefault();
    handleDragLeave(type);
    const files = event.dataTransfer.files;
    if (files) {
      void processFiles(files, type);
    }
  };

  const removePendingFile = (id: string, type: AssetType) => {
    if (type === "menu") {
      setMenuFiles((prev) => {
        const target = prev.find((row) => row.id === id);
        if (target) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return prev.filter((row) => row.id !== id);
      });
      return;
    }

    setGalleryFiles((prev) => {
      const target = prev.find((row) => row.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const deleteSavedAsset = async (asset: SavedAsset) => {
    setDeleteBusy(true);
    try {
      await vendorDeleteAsset(asset.id);
      await refreshAssets();
      setStatusMessage("Asset deleted.");
      setDeleteTarget(null);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to delete asset.",
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSave = async () => {
    const pendingFiles = [...menuFiles, ...galleryFiles];

    if (pendingFiles.length === 0) {
      setStatusMessage("Add at least one file before saving.");
      return;
    }

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
            "/vendor/menu-services/assets",
            "POST",
            {
              asset_url: file.assetUrl,
              asset_type: file.type,
              service_type: "restaurant",
              file_name: file.name,
              mime_type: isPdfFile(file.name) ? "application/pdf" : null,
            },
          ),
        ),
      );

      menuFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      galleryFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      setMenuFiles([]);
      setGalleryFiles([]);
      await refreshAssets();
      setStatusMessage("Restaurant assets saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save assets.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderUploadCard = (
    type: AssetType,
    title: string,
    description: string,
    files: PendingFile[],
    inputRef: React.RefObject<HTMLInputElement | null>,
    isDragging: boolean,
  ) => (
    <div className="flex flex-col rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="mb-8">
        <h3 className="mb-2 text-xl font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => handleDragOver(event, type)}
        onDragLeave={() => handleDragLeave(type)}
        onDrop={(event) => handleDrop(event, type)}
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
            Supports JPG, PNG, PDF
          </p>
        </div>
        <input
          type="file"
          ref={inputRef}
          onChange={(event) => handleFileSelect(event, type)}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
        />
      </div>

      {files.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Ready To Save
            </h4>
            <span className="text-xs font-bold text-slate-500">{files.length} files</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
              >
                <AssetPreview url={file.previewUrl} name={file.name} />
                <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-2 backdrop-blur-md">
                  <p className="truncate text-[9px] font-medium text-white">{file.name}</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/70">
                    {file.status}
                  </p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    removePendingFile(file.id, type);
                  }}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-opacity hover:bg-rose-500/80 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderSavedSection = (
    title: string,
    assets: SavedAsset[],
    emptyLabel: string,
  ) => (
    <section className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Manage the assets customers will see on your profile.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          {assets.length} saved
        </span>
      </div>

      {assets.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 text-center">
          <div>
            <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-500">{emptyLabel}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50/40"
            >
              <div className="relative aspect-[4/3]">
                <AssetPreview url={asset.assetUrl} name={asset.name} />
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-700">{asset.name}</p>
                  <a
                    href={asset.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e2a5e]"
                  >
                    Open file
                  </a>
                </div>
                <button
                  onClick={() => setDeleteTarget(asset)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                  aria-label={`Delete ${asset.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header title="Restaurant / Services" />

      <main className="flex-1 px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          {statusMessage ? (
            <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
          ) : null}

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-[32px] border border-slate-100 bg-white p-7 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Total Assets
              </p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-800">
                {overview.totalAssets}
              </p>
            </div>
            <div className="rounded-[32px] border border-slate-100 bg-white p-7 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Menu Files
              </p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-800">
                {overview.menuAssets}
              </p>
            </div>
            <div className="rounded-[32px] border border-slate-100 bg-white p-7 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Gallery Files
              </p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-800">
                {overview.galleryAssets}
              </p>
            </div>
          </section>

          <section className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#3b82f6]">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Restaurant Asset Flow</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Upload new menu files and gallery photos, review them before saving,
                  and manage the assets that are already published for your business.
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {renderUploadCard(
              "menu",
              "Menu Files",
              "Upload clear menu photos or PDF menus for customer viewing.",
              menuFiles,
              menuInputRef,
              isDraggingMenu,
            )}
            {renderUploadCard(
              "gallery",
              "Gallery Photos",
              "Upload storefront, dining area, food, and ambience photos.",
              galleryFiles,
              galleryInputRef,
              isDraggingGallery,
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void handleSave()}
              disabled={isSaving || isLoading}
              className="rounded-2xl bg-[#1e2a5e] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#1e2a5e]/20 transition hover:bg-[#1a234d] disabled:bg-slate-400 disabled:shadow-none"
            >
              {isSaving ? "Saving Assets..." : "Save Uploaded Assets"}
            </button>
          </div>

          {renderSavedSection(
            "Published Menu Files",
            savedMenuAssets,
            "No menu files uploaded yet.",
          )}
          {renderSavedSection(
            "Published Gallery Photos",
            savedGalleryAssets,
            "No gallery photos uploaded yet.",
          )}
        </div>
      </main>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this restaurant asset?"
        message={`"${deleteTarget?.name ?? "This asset"}" will be permanently removed from customer-facing content.`}
        confirmLabel="Delete asset"
        destructive
        busy={deleteBusy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void deleteSavedAsset(deleteTarget)}
      />
    </div>
  );
}
