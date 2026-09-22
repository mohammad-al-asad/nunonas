"use client";

import { Header } from "@/components/Header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import {
  uploadVendorFile,
  vendorGetProfileSettings,
  vendorCreateHappyHour,
  vendorDeleteHappyHour,
  vendorListHappyHours,
  vendorUpdateHappyHour,
  vendorUpdateHappyHourStatus,
  type VendorHappyHourPayload,
  type VendorHappyHourStatus,
} from "@/lib/vendor-api";
import { extractVendorCategories } from "@/lib/vendor-access";
import {
  Archive,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FilePenLine,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DEFAULT_TIMEZONE = "Asia/Dhaka";

type HappyHourRecord = VendorHappyHourPayload & {
  id: string;
  active?: boolean;
  legacy_event_id?: string | null;
};

type HappyHourForm = {
  title: string;
  venueType: VendorHappyHourPayload["venue_type"];
  offerText: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  timezone: string;
  venue: string;
  originalPrice: string;
  happyHourPrice: string;
  discountPercent: string;
  description: string;
  termsAndConditions: string;
  bannerImageUrl: string;
  status: VendorHappyHourStatus;
};

const BUSINESS_VENUE_OPTIONS = [
  { value: "restaurant", label: "Restaurant", category: "Restaurant" },
  { value: "hotel", label: "Hotel", category: "Hotel" },
  { value: "spa", label: "Spa", category: "Spa" },
] as const;

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultForm(): HappyHourForm {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    title: "",
    venueType: "restaurant",
    offerText: "",
    startDate: dateInputValue(start),
    endDate: dateInputValue(end),
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "17:00",
    endTime: "19:00",
    timezone: DEFAULT_TIMEZONE,
    venue: "",
    originalPrice: "",
    happyHourPrice: "",
    discountPercent: "",
    description: "",
    termsAndConditions: "",
    bannerImageUrl: "",
    status: "draft",
  };
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPayload(form: HappyHourForm): VendorHappyHourPayload {
  return {
    title: form.title.trim(),
    venue_type: form.venueType,
    offer_text: form.offerText.trim(),
    start_date: form.startDate,
    end_date: form.endDate,
    days_of_week: form.daysOfWeek,
    start_time: form.startTime,
    end_time: form.endTime,
    timezone: form.timezone.trim() || DEFAULT_TIMEZONE,
    venue: form.venue.trim(),
    original_price: optionalNumber(form.originalPrice),
    happy_hour_price: optionalNumber(form.happyHourPrice),
    discount_percent: optionalNumber(form.discountPercent),
    description: form.description.trim(),
    terms_and_conditions: form.termsAndConditions.trim(),
    banner_image_url: form.bannerImageUrl.trim() || null,
    active_status: true,
    status: form.status,
  };
}

function normalizeHappyHour(row: Record<string, unknown>): HappyHourRecord {
  return {
    id: String(row.id ?? row._id ?? ""),
    title: String(row.title ?? ""),
    venue_type: String(row.venue_type ?? "restaurant") as HappyHourRecord["venue_type"],
    offer_text: String(row.offer_text ?? ""),
    start_date: String(row.start_date ?? ""),
    end_date: String(row.end_date ?? ""),
    days_of_week: Array.isArray(row.days_of_week)
      ? row.days_of_week.map(String)
      : [],
    start_time: String(row.start_time ?? ""),
    end_time: String(row.end_time ?? ""),
    timezone: String(row.timezone ?? DEFAULT_TIMEZONE),
    venue: String(row.venue ?? ""),
    original_price:
      row.original_price == null ? null : Number(row.original_price),
    happy_hour_price:
      row.happy_hour_price == null ? null : Number(row.happy_hour_price),
    discount_percent:
      row.discount_percent == null ? null : Number(row.discount_percent),
    description: String(row.description ?? ""),
    terms_and_conditions: String(row.terms_and_conditions ?? ""),
    banner_image_url:
      row.banner_image_url == null ? null : String(row.banner_image_url),
    active_status: Boolean(row.active_status ?? row.active ?? true),
    active: Boolean(row.active ?? row.active_status ?? true),
    status: String(row.status ?? "draft").toLowerCase() as VendorHappyHourStatus,
    legacy_event_id:
      row.legacy_event_id == null ? null : String(row.legacy_event_id),
  };
}

function toForm(record: HappyHourRecord): HappyHourForm {
  return {
    title: record.title,
    venueType: record.venue_type,
    offerText: record.offer_text,
    startDate: record.start_date,
    endDate: record.end_date,
    daysOfWeek: record.days_of_week,
    startTime: record.start_time.slice(0, 5),
    endTime: record.end_time.slice(0, 5),
    timezone: record.timezone,
    venue: record.venue,
    originalPrice:
      record.original_price == null ? "" : String(record.original_price),
    happyHourPrice:
      record.happy_hour_price == null ? "" : String(record.happy_hour_price),
    discountPercent:
      record.discount_percent == null ? "" : String(record.discount_percent),
    description: record.description,
    termsAndConditions: record.terms_and_conditions,
    bannerImageUrl: record.banner_image_url ?? "",
    status: record.status,
  };
}

function isActiveNow(record: HappyHourRecord) {
  const now = new Date();
  let today = dateInputValue(now);
  let currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  let currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: record.timezone || DEFAULT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    today = `${value("year")}-${value("month")}-${value("day")}`;
    currentTime = `${value("hour")}:${value("minute")}`;
    currentDay = value("weekday").toLowerCase() as (typeof DAYS)[number];
  } catch {
    // Invalid legacy timezones fall back to the provider's browser timezone.
  }
  return (
    record.status === "published" &&
    record.active_status &&
    record.start_date <= today &&
    record.end_date >= today &&
    record.days_of_week.includes(currentDay) &&
    record.start_time.slice(0, 5) <= currentTime &&
    record.end_time.slice(0, 5) >= currentTime
  );
}

function money(value?: number | null) {
  if (value == null) return "Not set";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function validateForm(form: HappyHourForm) {
  if (!form.title.trim()) return "Happy Hour name is required.";
  if (!form.offerText.trim()) return "Offer details are required.";
  if (!form.venue.trim()) return "Venue or address is required.";
  if (!form.startDate || !form.endDate) return "Start and end dates are required.";
  if (form.endDate < form.startDate) return "End date cannot be before start date.";
  if (!form.startTime || !form.endTime || form.endTime <= form.startTime) {
    return "End time must be later than start time.";
  }
  if (!form.daysOfWeek.length) return "Select at least one active day.";
  const original = optionalNumber(form.originalPrice);
  const happy = optionalNumber(form.happyHourPrice);
  if (original != null && happy != null && happy > original) {
    return "Happy Hour price cannot exceed the original price.";
  }
  return "";
}

function inputClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
}

export function HappyHoursPageClient() {
  const { toast } = useToast();
  const [items, setItems] = useState<HappyHourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HappyHourForm>(() => defaultForm());
  const [deleteTarget, setDeleteTarget] = useState<HappyHourRecord | null>(null);
  const [enabledVenueTypes, setEnabledVenueTypes] = useState<typeof BUSINESS_VENUE_OPTIONS[number][]>([]);
  const [venueTypesLoaded, setVenueTypesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void vendorGetProfileSettings()
      .then((profile) => {
        if (cancelled) return;
        const categories = extractVendorCategories(profile.categories ?? profile.category);
        const available = BUSINESS_VENUE_OPTIONS.filter((option) =>
          categories.includes(option.category),
        );
        setEnabledVenueTypes(available.length ? available : [BUSINESS_VENUE_OPTIONS[0]]);
      })
      .catch(() => {
        if (!cancelled) setEnabledVenueTypes([BUSINESS_VENUE_OPTIONS[0]]);
      })
      .finally(() => {
        if (!cancelled) setVenueTypesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!venueTypesLoaded || !enabledVenueTypes.length) return;
    setForm((current) =>
      enabledVenueTypes.some((option) => option.value === current.venueType)
        ? current
        : { ...current, venueType: enabledVenueTypes[0].value },
    );
  }, [enabledVenueTypes, venueTypesLoaded]);

  const loadHappyHours = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await vendorListHappyHours({}, signal);
      const rows = Array.isArray(response.items) ? response.items : [];
      setItems(
        rows
          .filter(
            (row): row is Record<string, unknown> =>
              typeof row === "object" && row !== null,
          )
          .map(normalizeHappyHour),
      );
    } catch (error) {
      if (signal?.aborted) return;
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load Happy Hours.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadHappyHours(controller.signal);
    return () => controller.abort();
  }, [loadHappyHours]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!query) return true;
      return [
        item.title,
        item.offer_text,
        item.venue,
        item.venue_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      published: items.filter((item) => item.status === "published").length,
      activeNow: items.filter(isActiveNow).length,
      drafts: items.filter((item) => item.status === "draft").length,
    }),
    [items],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm());
    setMessage("");
    setFormOpen(true);
  };

  const openEdit = (record: HappyHourRecord) => {
    setEditingId(record.id);
    setForm(toForm(record));
    setMessage("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await vendorUpdateHappyHour(editingId, toPayload(form));
        setMessage("Happy Hour updated.");
        toast("Happy Hour updated.", "success");
      } else {
        await vendorCreateHappyHour(toPayload(form));
        setMessage("Happy Hour created.");
        toast("Happy Hour created.", "success");
      }
      setFormOpen(false);
      setEditingId(null);
      setForm(defaultForm());
      await loadHappyHours();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save Happy Hour.", "error");
      setMessage(
        error instanceof Error ? error.message : "Failed to save Happy Hour.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (
    record: HappyHourRecord,
    status: VendorHappyHourStatus,
  ) => {
    setActionId(record.id);
    setMessage("");
    try {
      const updated = normalizeHappyHour(
        await vendorUpdateHappyHourStatus(record.id, status),
      );
      setItems((current) =>
        current.map((item) => (item.id === record.id ? updated : item)),
      );
      setMessage(`Happy Hour moved to ${status}.`);
      toast(`Happy Hour moved to ${status}.`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update Happy Hour status.", "error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update Happy Hour status.",
      );
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionId(deleteTarget.id);
    try {
      await vendorDeleteHappyHour(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setMessage("Happy Hour deleted.");
      toast("Happy Hour deleted.", "success");
      setDeleteTarget(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to delete Happy Hour.", "error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete Happy Hour.",
      );
    } finally {
      setActionId("");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const url = await uploadVendorFile(file);
      setForm((current) => ({ ...current, bannerImageUrl: url }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f7f9fc]">
      <Header
        title="Happy Hour Management"
        description="Manage recurring offers independently from events."
      />
      <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Publish time-limited offers with their own schedule, venue, and
              pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-[#17204b]"
          >
            <Plus className="h-4 w-4" />
            Create Happy Hour
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Happy Hours", value: stats.total, icon: BadgePercent, color: "text-indigo-600 bg-indigo-50" },
            { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
            { label: "Active now", value: stats.activeNow, icon: Sparkles, color: "text-amber-600 bg-amber-50" },
            { label: "Drafts", value: stats.drafts, icon: FilePenLine, color: "text-slate-600 bg-slate-100" },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Happy Hours, offers, or venues"
                className={`${inputClass()} pl-11`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass()} md:w-52`}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {message ? (
            <p
              role="status"
              className="mx-5 mt-5 rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800"
            >
              {message}
            </p>
          ) : null}

          <div className="space-y-4 p-5">
            {loading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-500">
                Loading Happy Hours...
              </div>
            ) : filteredItems.length ? (
              filteredItems.map((record) => {
                const activeNow = isActiveNow(record);
                return (
                  <article
                    key={record.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40"
                  >
                    <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
                      <div
                        className="min-h-48 bg-gradient-to-br from-indigo-900 via-indigo-700 to-fuchsia-500 bg-cover bg-center"
                        style={
                          record.banner_image_url
                            ? {
                                backgroundImage: `linear-gradient(135deg,rgba(15,23,42,.15),rgba(30,42,94,.35)),url("${record.banner_image_url}")`,
                              }
                            : undefined
                        }
                      >
                        <div className="flex h-full min-h-48 items-start justify-between p-4">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black capitalize text-slate-700 shadow">
                            {record.status}
                          </span>
                          {activeNow ? (
                            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white shadow">
                              Live now
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-black text-slate-900">
                                {record.title}
                              </h2>
                              <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-[11px] font-black capitalize text-fuchsia-700">
                                {record.venue_type}
                              </span>
                              {record.legacy_event_id ? (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                                  Migrated
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-base font-black text-indigo-700">
                              {record.offer_text}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(record)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 hover:border-sky-300 hover:text-sky-700"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            {record.status !== "published" ? (
                              <button
                                type="button"
                                disabled={actionId === record.id}
                                onClick={() => void handleStatus(record, "published")}
                                className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                Publish
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionId === record.id}
                                onClick={() => void handleStatus(record, "draft")}
                                className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                              >
                                Move to draft
                              </button>
                            )}
                            {record.status !== "archived" ? (
                              <button
                                type="button"
                                disabled={actionId === record.id}
                                onClick={() => void handleStatus(record, "archived")}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                Archive
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(record)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                          <p className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>
                              {formatDate(record.start_date)} -{" "}
                              {formatDate(record.end_date)}
                            </span>
                          </p>
                          <p className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>
                              {record.start_time.slice(0, 5)} -{" "}
                              {record.end_time.slice(0, 5)}
                            </span>
                          </p>
                          <p className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>{record.venue}</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span>
                              {money(record.happy_hour_price)}
                              {record.original_price != null
                                ? ` (was ${money(record.original_price)})`
                                : ""}
                            </span>
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {record.days_of_week.map((day) => (
                            <span
                              key={day}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black capitalize text-slate-500"
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                        {record.description ? (
                          <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-500">
                            {record.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <BadgePercent className="h-8 w-8" />
                </span>
                <h2 className="mt-5 text-lg font-black text-slate-900">
                  No Happy Hours found
                </h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Create a separate Happy Hour offer or change the current
                  search and status filters.
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-black text-white"
                >
                  Create Happy Hour
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {formOpen ? (
        <div className="fixed inset-0 z-[160] overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="mx-auto my-4 w-full max-w-4xl rounded-3xl bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-7">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {editingId ? "Edit Happy Hour" : "Create Happy Hour"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This offer is stored and published independently from Events.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close form"
                onClick={() => setFormOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Happy Hour name
                </span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Sunset Happy Hour"
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Venue type
                </span>
                <select
                  value={form.venueType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      venueType: event.target
                        .value as HappyHourForm["venueType"],
                    }))
                  }
                  className={inputClass()}
                >
                  {enabledVenueTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as VendorHappyHourStatus,
                    }))
                  }
                  className={inputClass()}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Offer shown to customers
                </span>
                <input
                  value={form.offerText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      offerText: event.target.value,
                    }))
                  }
                  placeholder="Buy one drink, get the second free"
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Start date
                </span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  End date
                </span>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Starts at
                </span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Ends at
                </span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Active days
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {DAYS.map((day) => {
                    const selected = form.daysOfWeek.includes(day);
                    return (
                      <label
                        key={day}
                        className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-black capitalize transition ${
                          selected
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-500 hover:border-indigo-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selected}
                          onChange={() =>
                            setForm((current) => ({
                              ...current,
                              daysOfWeek: selected
                                ? current.daysOfWeek.filter(
                                    (item) => item !== day,
                                  )
                                : [...current.daysOfWeek, day],
                            }))
                          }
                        />
                        {day.slice(0, 3)}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Venue / address
                </span>
                <div>
                  <input
                    value={form.venue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        venue: event.target.value,
                      }))
                    }
                    placeholder="Venue name, street, city"
                    className={inputClass()}
                  />
                </div>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Original price
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      originalPrice: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Happy Hour price
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.happyHourPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      happyHourPrice: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Discount %
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.discountPercent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discountPercent: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Timezone
                </span>
                <input
                  value={form.timezone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Description
                </span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Terms and conditions
                </span>
                <textarea
                  rows={3}
                  value={form.termsAndConditions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      termsAndConditions: event.target.value,
                    }))
                  }
                  className={inputClass()}
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Banner image
                </span>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <ImagePlus className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.bannerImageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bannerImageUrl: event.target.value,
                        }))
                      }
                      placeholder="Image URL or upload a file"
                      className={`${inputClass()} pl-11`}
                    />
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 hover:border-sky-300 hover:text-sky-700">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(event) => void handleImageUpload(event)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-7">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
                className="rounded-xl px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || uploading}
                className="rounded-xl bg-[#1e2a5e] px-6 py-3 text-sm font-black text-white hover:bg-[#17204b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create Happy Hour"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Happy Hour?"
        message={`This permanently removes “${deleteTarget?.title ?? "this Happy Hour"}”.`}
        confirmLabel="Delete"
        destructive
        busy={Boolean(deleteTarget && actionId === deleteTarget.id)}
        onClose={() => {
          if (!actionId) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
