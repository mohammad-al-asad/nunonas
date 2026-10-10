"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Sparkles, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import {
  uploadVendorFile,
  vendorCreateService,
  vendorDeleteService,
  vendorListServices,
  vendorUpdateService,
  vendorUpdateServiceStatus,
} from "@/lib/vendor-api";
import { vendorProfileQuery } from "@/lib/vendor-queries";
import { cn } from "@/lib/utils";

export type MenuServiceType = "restaurant" | "spa";

// Wording per service. Sections are suggestions; providers can type their own.
const COPY = {
  restaurant: {
    title: "Menu Items",
    intro: "Dishes and drinks with a name, description, price and photo. Customers see them in the app's Menu tab.",
    noun: "menu item",
    nameLabel: "Name",
    namePlaceholder: "Chicken Biryani",
    nameRequired: "Enter the dish name.",
    descriptionPlaceholder: "Ingredients, portion size, spice level...",
    sectionPlaceholder: "Main Course",
    sections: ["Starters", "Main Course", "Platters", "Sides", "Desserts", "Drinks"],
    emptyTitle: "No menu items yet.",
    emptyHint: "Add your dishes so customers can browse the menu before booking.",
    Icon: UtensilsCrossed,
  },
  spa: {
    title: "Treatments",
    intro: "Massages, facials and other treatments with a name, description, price and photo. Customers see them in the app's Menu tab and choose one when booking.",
    noun: "treatment",
    nameLabel: "Treatment name",
    namePlaceholder: "Swedish Massage (60 min)",
    nameRequired: "Enter the treatment name.",
    descriptionPlaceholder: "What's included, duration, benefits...",
    sectionPlaceholder: "Massage",
    sections: ["Massage", "Facial", "Body Treatment", "Nail Care", "Hair", "Packages"],
    emptyTitle: "No treatments yet.",
    emptyHint: "Add your treatments so customers can see prices and book them in the app.",
    Icon: Sparkles,
  },
} as const;

type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  active: boolean;
};

type MenuItemForm = {
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
  active: boolean;
};

const EMPTY_FORM: MenuItemForm = { name: "", description: "", category: "", price: "", image: "", active: true };

const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500";
const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function toMenuItem(raw: Record<string, unknown>): MenuItem {
  const images = Array.isArray(raw.images) ? raw.images : [];
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    price: Number(raw.price ?? 0),
    image: String(images[0] ?? ""),
    active: raw.active_status !== false && raw.available !== false,
  };
}

function currencyCode(profile: Record<string, unknown> | undefined) {
  const value = String(profile?.currency_code ?? profile?.currency ?? "USD").toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : "USD";
}

/** Menu items or treatments (name, description, price, section, photo) shown in the app's Menu tab. */
export function MenuItemsManager({ serviceType }: { serviceType: MenuServiceType }) {
  const copy = COPY[serviceType];
  const Icon = copy.Icon;
  const { toast } = useToast();
  const profileQuery = useQuery(vendorProfileQuery());
  const currency = currencyCode(profileQuery.data as Record<string, unknown> | undefined);
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [form, setForm] = useState<MenuItemForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    vendorListServices(serviceType)
      .then((result) => {
        if (!cancelled) setItems((result.items ?? []).map(toMenuItem));
      })
      .catch((error) => {
        if (!cancelled) toast(error instanceof Error ? error.message : `Failed to load ${copy.noun}s.`, "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast, serviceType, copy.noun]);

  const sections = Array.from(new Set(items.map((item) => item.category || "Other")));
  const categoryOptions = Array.from(new Set([...copy.sections, ...items.map((item) => item.category).filter(Boolean)]));

  const openEditor = (item: MenuItem | "new") => {
    setEditing(item);
    setFormError("");
    setForm(
      item === "new"
        ? EMPTY_FORM
        : { name: item.name, description: item.description, category: item.category, price: String(item.price), image: item.image, active: item.active },
    );
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Choose a JPG, PNG or WebP photo.");
      return;
    }
    setUploading(true);
    setFormError("");
    try {
      const url = await uploadVendorFile(file);
      setForm((current) => ({ ...current, image: url }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveItem = async () => {
    const price = Number(form.price);
    if (!form.name.trim()) return setFormError(copy.nameRequired);
    if (!form.category.trim()) return setFormError("Choose or type a menu section.");
    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) return setFormError("Enter a valid price.");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price,
      images: form.image ? [form.image] : [],
      service_type: serviceType,
      active_status: form.active,
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = toMenuItem(
        editing === "new" || !editing
          ? await vendorCreateService(payload)
          : await vendorUpdateService(editing.id, payload),
      );
      setItems((current) =>
        editing === "new" ? [saved, ...current] : current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setEditing(null);
      toast(editing === "new" ? `Added ${copy.noun}.` : `Updated ${copy.noun}.`, "success");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : `Failed to save ${copy.noun}.`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: MenuItem) => {
    try {
      const updated = toMenuItem(await vendorUpdateServiceStatus(item.id, !item.active));
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (error) {
      toast(error instanceof Error ? error.message : `Failed to update ${copy.noun}.`, "error");
    }
  };

  const deleteItem = async (item: MenuItem) => {
    setDeleteBusy(true);
    try {
      await vendorDeleteService(item.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setDeleteTarget(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : `Failed to delete ${copy.noun}.`, "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <section aria-labelledby="menu-items-title" className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="menu-items-title" className="text-xl font-black text-slate-800">{copy.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{copy.intro}</p>
        </div>
        <button
          type="button"
          onClick={() => openEditor("new")}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#1e2a5e]/20 transition hover:bg-[#1a234d]"
        >
          <Plus className="h-4 w-4" />
          Add {copy.noun}
        </button>
      </div>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse rounded-3xl bg-slate-50" />
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <Icon className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-500">{copy.emptyTitle}</p>
          <p className="mt-1 text-xs text-slate-400">{copy.emptyHint}</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <div key={section}>
              <h4 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{section}</h4>
              <ul className="mt-3 divide-y divide-slate-100 rounded-3xl border border-slate-100">
                {items.filter((item) => (item.category || "Other") === section).map((item) => (
                  <li key={item.id} className={cn("flex items-center gap-4 p-4", !item.active && "opacity-60")}>
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Icon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-800">{item.name}</p>
                        {!item.active ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Hidden</span>
                        ) : null}
                      </div>
                      {item.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p> : null}
                    </div>
                    <p className="shrink-0 text-sm font-black text-slate-800">{formatPrice(item.price)}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void toggleActive(item)}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
                      >
                        {item.active ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditor(item)}
                        aria-label={`Edit ${item.name}`}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !saving && setEditing(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-editor-title"
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 id="menu-item-editor-title" className="text-lg font-black text-slate-800">
                {editing === "new" ? `Add ${copy.noun}` : `Edit ${copy.noun}`}
              </h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <span className={labelClass}>Photo</span>
                <div className="mt-1 flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {form.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300"><ImagePlus className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-[#1e2a5e] transition hover:bg-slate-200 disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : form.image ? "Change photo" : "Upload photo"}
                    </button>
                    {form.image ? (
                      <button type="button" onClick={() => setForm((current) => ({ ...current, image: "" }))} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50">
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
                </div>
              </div>
              <label className="block">
                <span className={labelClass}>{copy.nameLabel}</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={120} placeholder={copy.namePlaceholder} className={inputClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  maxLength={500}
                  rows={3}
                  placeholder={copy.descriptionPlaceholder}
                  className={inputClass}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>{serviceType === "spa" ? "Category" : "Menu section"}</span>
                  <input
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    list="menu-item-sections"
                    maxLength={60}
                    placeholder={copy.sectionPlaceholder}
                    className={inputClass}
                  />
                  <datalist id="menu-item-sections">
                    {categoryOptions.map((category) => <option key={category} value={category} />)}
                  </datalist>
                </label>
                <label className="block">
                  <span className={labelClass}>Price ({currency})</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">Show in the app</span>
              </label>
              {formError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{formError}</p> : null}
            </div>
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveItem()}
                disabled={saving || uploading}
                className="rounded-xl bg-[#1e2a5e] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : editing === "new" ? `Add ${copy.noun}` : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete this ${copy.noun}?`}
        message={`"${deleteTarget?.name ?? "This item"}" will be removed from the app.`}
        confirmLabel={`Delete ${copy.noun}`}
        destructive
        busy={deleteBusy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void deleteItem(deleteTarget)}
      />
    </section>
  );
}
