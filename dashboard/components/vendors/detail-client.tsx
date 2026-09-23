"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DashboardVendor, VendorVerificationDocument } from "@/lib/vendors-admin";
import { VendorDetailSkeleton } from "@/components/vendors/detail-skeleton";
import {
  DollarSign,
  Users,
  CalendarX2,
  Clock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const refreshIntervalMs = 30_000;

function primaryVendorAction(status: DashboardVendor["status"]): "approve" | "unblock" {
  return status === "BLOCKED" ? "unblock" : "approve";
}

function primaryVendorActionLabel(status: DashboardVendor["status"]) {
  return status === "BLOCKED" ? "Unblock" : "Approve";
}

function reviewActionTitle(action: "approve" | "block" | "unblock" | "cancel") {
  if (action === "block") return "Block";
  if (action === "unblock") return "Unblock";
  if (action === "cancel") return "Cancel Review";
  return "Approval";
}

function vendorInitials(vendor: DashboardVendor) {
  const source = vendor.businessName || vendor.owner || vendor.id;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "VN";
}

function renderAvatar(vendor: DashboardVendor) {
  if (vendor.avatar) {
    return (
      <Image
        src={vendor.avatar}
        alt={vendor.businessName}
        width={112}
        height={112}
        className="h-28 w-28 rounded-3xl object-cover"
      />
    );
  }

  return (
    <div className="grid h-28 w-28 place-items-center rounded-3xl bg-[#edf2fb] text-[30px] font-semibold text-[#415a91]">
      {vendorInitials(vendor)}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusLabel(value: string) {
  if (!value) return "Pending";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function sectionEntries(section: Record<string, unknown>) {
  return Object.entries(section).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function looksLikeDateField(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized.endsWith("_at") ||
    normalized.includes("date") ||
    normalized.includes("time") ||
    normalized.includes("sync")
  );
}

function displayValue(key: string, value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string" && looksLikeDateField(key)) {
    return formatDate(value);
  }
  return String(value);
}

function isImageDocument(url: string) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url);
}

function isPdfDocument(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

function stars(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => (
    <svg
      key={`star-${index}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={index < rounded ? "currentColor" : "none"}
      className={index < rounded ? "text-[#f59e0b]" : "text-[#d7deea]"}
    >
      <path
        d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ));
}

function DocumentsGrid({ docs }: { docs: VendorVerificationDocument[] }) {
  const [activeDoc, setActiveDoc] = useState<VendorVerificationDocument | null>(null);
  const [zoom, setZoom] = useState(1);

  if (docs.length === 0) {
    return <p className="text-[13px] text-[#8b96ad]">No verification documents uploaded.</p>;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {docs.map((doc) => (
          <button
            key={`${doc.title}-${doc.url}`}
            type="button"
            onClick={() => {
              setActiveDoc(doc);
              setZoom(1);
            }}
            className="overflow-hidden rounded-3xl border border-[#e6ecf7] bg-white text-left transition hover:border-[#bfd0f7] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          >
            <div>
              {isImageDocument(doc.url) ? (
                <div className="bg-[linear-gradient(135deg,#edf5ff,#f8fafc)] p-4">
                  <img
                    src={doc.url}
                    alt={doc.title}
                    className="h-52 w-full rounded-2xl border border-[#dde7f5] object-cover"
                  />
                </div>
              ) : (
                <div className="grid h-52 place-items-center bg-[linear-gradient(135deg,#edf5ff,#f8fafc)] text-[#6b7b99]">
                  <div className="text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M7 4h7l4 4v12H7V4Z" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </div>
                    <p className="m-0 mt-3 text-[12px] font-semibold">Open document</p>
                    <p className="m-0 mt-1 text-[11px] text-[#8b96ad]">Preview inside dashboard</p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="m-0 text-[13px] font-semibold text-[#1f2d46]">{doc.title}</p>
                  <p className="m-0 mt-2 text-[11px] text-[#7b89a3]">
                    {isImageDocument(doc.url) ? "Tap to zoom" : "Tap to preview"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    doc.status === "Verified"
                      ? "bg-[#dcfce7] text-[#15803d]"
                      : doc.status === "Rejected"
                        ? "bg-[#fee2e2] text-[#dc2626]"
                        : "bg-[#fff4cc] text-[#b45309]"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/70 p-4">
          <div className="flex h-[min(88vh,900px)] w-[min(92vw,1180px)] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between border-b border-[#e6ecf7] px-5 py-4">
              <div>
                <h4 className="m-0 text-[16px] font-semibold text-[#1d2a43]">{activeDoc.title}</h4>
                <p className="m-0 mt-1 text-[11px] text-[#7b89a3]">Document preview inside dashboard</p>
              </div>
              <div className="flex items-center gap-2">
                {isImageDocument(activeDoc.url) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoom((current) => Math.max(0.5, current - 0.25))}
                      className="rounded-xl border border-[#dbe2ef] px-3 py-2 text-[12px] font-semibold text-[#4e5f83]"
                    >
                      -
                    </button>
                    <span className="min-w-14 text-center text-[12px] font-semibold text-[#4e5f83]">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((current) => Math.min(3, current + 0.25))}
                      className="rounded-xl border border-[#dbe2ef] px-3 py-2 text-[12px] font-semibold text-[#4e5f83]"
                    >
                      +
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveDoc(null)}
                  className="rounded-xl bg-[#1f3d8f] px-4 py-2 text-[12px] font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-5">
              {isImageDocument(activeDoc.url) ? (
                <div className="flex min-h-full items-center justify-center">
                  <img
                    src={activeDoc.url}
                    alt={activeDoc.title}
                    className="max-w-none rounded-2xl border border-[#dbe2ef] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                  />
                </div>
              ) : isPdfDocument(activeDoc.url) ? (
                <iframe
                  src={activeDoc.url}
                  title={activeDoc.title}
                  className="h-full min-h-[680px] w-full rounded-2xl border border-[#dbe2ef] bg-white"
                />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center">
                  <div className="max-w-md rounded-3xl border border-[#dbe2ef] bg-white p-8 text-center">
                    <p className="m-0 text-[16px] font-semibold text-[#1d2a43]">Preview unavailable</p>
                    <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
                      This document type cannot be embedded yet, but it remains inside the dashboard flow.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

async function fetchVendorDetail(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/vendors/${encodeURIComponent(id)}`, { signal });
  if (response.status === 404) {
    return { vendor: null, notFound: true };
  }
  if (!response.ok) {
    throw new Error("Failed to load service provider details");
  }
  const payload = (await response.json()) as { vendor?: DashboardVendor };
  return { vendor: payload.vendor ?? null, notFound: false };
}

export function VendorDetailPageClient({ vendorId }: { vendorId: string }) {
  const [vendor, setVendor] = useState<DashboardVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | "block" | "unblock" | "cancel" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadVendor = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchVendorDetail(vendorId, signal);
      setVendor(result.vendor);
      setNotFound(result.notFound);
    } catch (loadError) {
      if ((loadError as { name?: string }).name !== "AbortError") {
        setError("Failed to load live service provider details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    void loadVendor(controller.signal);

    const intervalId = window.setInterval(() => {
      void loadVendor();
    }, refreshIntervalMs);

    const handleWindowRefresh = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadVendor();
    };

    window.addEventListener("focus", handleWindowRefresh);
    document.addEventListener("visibilitychange", handleWindowRefresh);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowRefresh);
      document.removeEventListener("visibilitychange", handleWindowRefresh);
    };
  }, [vendorId]);

  const submitAction = async () => {
    if (!pendingAction) {
      return;
    }

    setActionBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/vendors/${encodeURIComponent(vendorId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: pendingAction === "unblock" ? "approve" : pendingAction,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update service provider");
      }

      setPendingAction(null);
      await loadVendor();
    } catch {
      setError("Failed to update service provider status.");
    } finally {
      setActionBusy(false);
    }
  };

  const sections = useMemo(() => {
    if (!vendor) return [];
    return [
      { label: "Profile", values: vendor.sections.profile },
      { label: "Business", values: vendor.sections.business },
      { label: "Verification", values: vendor.sections.verification },
      { label: "Admin Review", values: vendor.sections.adminReview },
    ].filter((section) => sectionEntries(section.values).length > 0);
  }, [vendor]);

  const leftSections = useMemo(
    () => sections.filter((section) => section.label === "Profile" || section.label === "Business"),
    [sections],
  );
  const rightSections = useMemo(
    () => sections.filter((section) => section.label === "Verification" || section.label === "Admin Review"),
    [sections],
  );

  if (loading && !vendor) {
    return <VendorDetailSkeleton />;
  }

  if (error && !vendor) {
    return (
      <div className="rounded-3xl border border-[#fee2e2] bg-[#fff5f5] p-6 text-[#b91c1c]">
        {error}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-3xl border border-[#e6ecf7] bg-white p-6 text-[#60718f]">
        Service provider not found.
      </div>
    );
  }

  if (!vendor) {
    return <VendorDetailSkeleton />;
  }

  return (
    <section className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8b96ad]">
            Service provider management
          </p>
          <h1 className="m-0 mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#18233c]">
            {vendor.businessName}
          </h1>
          <p className="m-0 mt-2 text-[13px] text-[#60718f]">
            Live service provider detail view with current profile, verification, and uploaded documents.
          </p>
        </div>
        <Link
          href="/vendors"
          className="inline-flex h-10 items-center rounded-xl border border-[#dbe2ef] px-4 text-[13px] font-medium text-[#4e5f83]"
        >
          Back
        </Link>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#e6ecf7] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            {renderAvatar(vendor)}
            <div className="space-y-3">
              <div>
                <h2 className="m-0 text-[24px] font-semibold text-[#1d2a43]">{vendor.businessName}</h2>
                <p className="m-0 mt-1 text-[14px] text-[#60718f]">{vendor.owner}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-semibold text-[#1f3d8f]">
                  {vendor.category}
                </span>
                <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-[11px] font-semibold text-[#64748b]">
                  Service Provider ID: {vendor.id}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    vendor.status === "APPROVED"
                      ? "bg-[#dcfce7] text-[#15803d]"
                      : vendor.status === "BLOCKED" || vendor.status === "REJECTED"
                        ? "bg-[#fee2e2] text-[#dc2626]"
                        : "bg-[#fff4cc] text-[#b45309]"
                  }`}
                >
                  {vendor.status}
                </span>
              </div>
              <div className="grid gap-3 text-[13px] text-[#1f2d46] sm:grid-cols-2">
                <p className="m-0"><span className="font-semibold">Email:</span> {vendor.email || "N/A"}</p>
                <p className="m-0"><span className="font-semibold">Phone:</span> {vendor.phone || "N/A"}</p>
                <p className="m-0 sm:col-span-2"><span className="font-semibold">Address:</span> {vendor.verification.address}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[330px]">
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-[#8b96ad]">Rating</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-[32px] leading-none text-[#1d2a43]">{vendor.verification.reviewScore.toFixed(1)}</span>
                <span className="flex items-center gap-1">{stars(vendor.verification.reviewScore)}</span>
              </div>
              <p className="m-0 mt-2 text-[11px] text-[#7b89a3]">
                {vendor.verification.reviewCount.toLocaleString()} verified reviews
              </p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-[#8b96ad]">Verification</p>
              <p className="m-0 mt-2 text-[16px] font-semibold text-[#1d2a43]">
                {statusLabel(vendor.verification.status)}
              </p>
              <p className="m-0 mt-2 text-[11px] text-[#7b89a3]">
                Created {formatDate(vendor.createdAt)}
              </p>
              <p className="m-0 mt-1 text-[11px] text-[#7b89a3]">
                Updated {formatDate(vendor.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#e6ecf7] bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Service provider actions</h3>
            <p className="m-0 mt-1 text-[12px] text-[#7b89a3]">Approve, block, or cancel directly from this service provider page.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPendingAction(primaryVendorAction(vendor.status))}
              disabled={vendor.status === "APPROVED" || actionBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f3d8f] px-5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {primaryVendorActionLabel(vendor.status)}
            </button>
            <button
              type="button"
              onClick={() => setPendingAction("block")}
              disabled={vendor.status === "BLOCKED" || actionBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#fecaca] bg-[#fff5f5] px-5 text-[13px] font-semibold text-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Block
            </button>
            <button
              type="button"
              onClick={() => setPendingAction("cancel")}
              disabled={vendor.status === "PENDING" || actionBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dbe2ef] bg-white px-5 text-[13px] font-medium text-[#4e5f83] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel Review
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            {(() => {
              const insights = vendor.insights ?? {
                totalEarned: 0,
                billingEarnings: null,
                billingPayout: null,
                totalBookings: vendor.bookings || 0,
                completedBookings: 0,
                confirmedBookings: 0,
                canceledBookings: 0,
                cancellationRate: 0,
                unansweredBookings: 0,
                uniqueCustomers: 0,
                totalReviews: vendor.verification.reviewCount || 0,
                averageRating: vendor.verification.reviewScore || 0,
                unansweredReviews: 0,
                servicesCount: 0,
              };

              return (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#eef2ff] text-[#1f3d8f]">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Business overview</h3>
                      </div>
                      <p className="m-0 mt-1 text-[13px] text-[#60718f]">
                        Live performance insights, customer booking activity, and business operational overview.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {vendor.website ? (
                        <a
                          href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe2ef] bg-[#f8fafc] px-3 py-1 text-[11px] font-medium text-[#475569] transition hover:border-[#1f3d8f] hover:text-[#1f3d8f]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{vendor.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : null}
                      <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-[11px] font-medium text-[#64748b]">
                        {vendor.category}
                      </span>
                      {insights.servicesCount > 0 ? (
                        <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-[11px] font-medium text-[#047857]">
                          {insights.servicesCount} Active Services
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Primary Performance Insights Grid */}
                  <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* 1. Total Earned */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#dcfce7] bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_100%)] p-4 shadow-[0_2px_8px_rgba(22,163,74,0.04)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#15803d]">
                          Total Earned
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#dcfce7] text-[#16a34a]">
                          <DollarSign className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-[26px] font-bold tracking-tight text-[#0f172a]">
                          ${insights.totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#15803d]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Completed bookings</span>
                        </div>
                        <div className="mt-1 text-[10px] text-[#64748b] truncate">
                          {insights.billingPayout ? `Payout: ${insights.billingPayout}` : "Live booking revenue"}
                        </div>
                      </div>
                    </div>

                    {/* 2. Customers Booked */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#dbeafe] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_100%)] p-4 shadow-[0_2px_8px_rgba(37,99,235,0.04)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1d4ed8]">
                          Customers Booked
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#dbeafe] text-[#2563eb]">
                          <Users className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-[26px] font-bold tracking-tight text-[#0f172a]">
                          {insights.uniqueCustomers} <span className="text-[14px] font-medium text-[#64748b]">Users</span>
                        </div>
                        <div className="mt-2 text-[11px] font-medium text-[#1e40af] truncate">
                          {insights.totalBookings} total bookings
                        </div>
                        <div className="mt-1 text-[10px] text-[#64748b] truncate">
                          {insights.completedBookings} completed • {insights.confirmedBookings} active
                        </div>
                      </div>
                    </div>

                    {/* 3. Cancellations */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#fee2e2] bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_100%)] p-4 shadow-[0_2px_8px_rgba(225,29,72,0.04)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#b91c1c]">
                          Cancellations
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fee2e2] text-[#e11d48]">
                          <CalendarX2 className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-[26px] font-bold tracking-tight text-[#0f172a]">
                          {insights.canceledBookings} <span className="text-[14px] font-medium text-[#64748b]">Cancelled</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10px] font-semibold text-[#991b1b] whitespace-nowrap">
                            {insights.cancellationRate}% cancellation rate
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-[#64748b] truncate">
                          {insights.canceledBookings === 0 ? "Zero cancellations" : "Cancelled booking requests"}
                        </div>
                      </div>
                    </div>

                    {/* 4. Unanswered / Pending Requests */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#fef3c7] bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_100%)] p-4 shadow-[0_2px_8px_rgba(217,119,6,0.04)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#b45309]">
                          Unanswered / Pending
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fef3c7] text-[#d97706]">
                          <Clock className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-[26px] font-bold tracking-tight text-[#0f172a]">
                          {insights.unansweredBookings} <span className="text-[14px] font-medium text-[#64748b]">Pending</span>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                              insights.unansweredBookings > 0
                                ? "bg-[#fed7aa] text-[#9a3412]"
                                : "bg-[#dcfce7] text-[#166534]"
                            }`}
                          >
                            {insights.unansweredBookings > 0 ? "Action Required" : "All cleared"}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-[#64748b] truncate">
                          {insights.unansweredBookings > 0
                            ? `${insights.unansweredBookings} awaiting confirmation`
                            : insights.unansweredReviews > 0
                              ? `+ ${insights.unansweredReviews} review awaiting reply`
                              : `${insights.totalReviews} total customer review${insights.totalReviews === 1 ? "" : "s"}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Fulfillment Breakdown Bar */}
                  {insights.totalBookings > 0 ? (
                    <div className="mt-6 rounded-2xl border border-[#f1f5f9] bg-[#f8fafc] p-4">
                      <div className="flex items-center justify-between text-[12px] font-medium text-[#475569]">
                        <span className="text-[11px] uppercase tracking-[0.06em] text-[#8b96ad]">
                          Booking Fulfillment Breakdown
                        </span>
                        <span className="text-[11px] text-[#64748b]">
                          {insights.totalBookings} Total Requests
                        </span>
                      </div>
                      <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                        {insights.completedBookings > 0 ? (
                          <div
                            style={{ width: `${(insights.completedBookings / insights.totalBookings) * 100}%` }}
                            className="bg-[#22c55e] transition-all"
                            title={`Completed: ${insights.completedBookings}`}
                          />
                        ) : null}
                        {insights.confirmedBookings > 0 ? (
                          <div
                            style={{ width: `${(insights.confirmedBookings / insights.totalBookings) * 100}%` }}
                            className="bg-[#3b82f6] transition-all"
                            title={`Confirmed: ${insights.confirmedBookings}`}
                          />
                        ) : null}
                        {insights.unansweredBookings > 0 ? (
                          <div
                            style={{ width: `${(insights.unansweredBookings / insights.totalBookings) * 100}%` }}
                            className="bg-[#f59e0b] transition-all"
                            title={`Pending / Unanswered: ${insights.unansweredBookings}`}
                          />
                        ) : null}
                        {insights.canceledBookings > 0 ? (
                          <div
                            style={{ width: `${(insights.canceledBookings / insights.totalBookings) * 100}%` }}
                            className="bg-[#ef4444] transition-all"
                            title={`Cancelled: ${insights.canceledBookings}`}
                          />
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                          <span className="text-[#334155]">Completed: <strong className="text-[#0f172a]">{insights.completedBookings}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                          <span className="text-[#334155]">Confirmed / Active: <strong className="text-[#0f172a]">{insights.confirmedBookings}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                          <span className="text-[#334155]">Pending / Unanswered: <strong className="text-[#0f172a]">{insights.unansweredBookings}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                          <span className="text-[#334155]">Cancelled: <strong className="text-[#0f172a]">{insights.canceledBookings}</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Provider Bio / Business Summary */}
                  <div className="mt-5 rounded-2xl border border-[#edf2f7] bg-[#fbfcfd] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">
                        Provider Bio / Business Summary
                      </span>
                      {vendor.verification.address ? (
                        <span className="text-[11px] text-[#64748b]">
                          {vendor.verification.address}
                        </span>
                      ) : null}
                    </div>
                    <p className="m-0 mt-2 text-[13px] leading-relaxed text-[#475569]">
                      {vendor.verification.description || "No custom business description provided by provider."}
                    </p>
                  </div>
                </>
              );
            })()}
          </article>

          {leftSections.map((section) => (
            <article
              key={section.label}
              className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">{section.label}</h3>
                  <p className="m-0 mt-1 text-[12px] text-[#7b89a3]">Current live backend values</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {sectionEntries(section.values).map(([key, value]) => (
                  <div
                    key={`${section.label}-${key}`}
                    className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-3 sm:min-h-[92px]"
                  >
                    <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">
                      {key.replaceAll("_", " ")}
                    </p>
                    <p className="m-0 mt-2 break-words text-[13px] leading-6 text-[#1f2d46]">
                      {displayValue(key, value)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <article className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Verification documents</h3>
                <p className="m-0 mt-1 text-[13px] text-[#7b89a3]">
                  Live previews from service provider verification records.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <DocumentsGrid docs={vendor.verification.docs} />
            </div>
          </article>

          {vendor.verification.rejectionReason ? (
            <article className="rounded-[24px] border border-[#fee2e2] bg-[#fff5f5] p-6">
              <h3 className="m-0 text-[16px] font-semibold text-[#b91c1c]">Review note</h3>
              <p className="m-0 mt-3 text-[14px] leading-7 text-[#b91c1c]">
                {vendor.verification.rejectionReason}
              </p>
            </article>
          ) : null}
        </div>

        <div className="space-y-6">
          <article className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Verification status</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Current status</p>
                <p className="m-0 mt-2 text-[18px] font-semibold text-[#1d2a43]">
                  {statusLabel(vendor.verification.status)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Last sync</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{formatDate(vendor.updatedAt)}</p>
              </div>
            </div>
          </article>

          {rightSections.map((section) => (
            <article
              key={section.label}
              className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">{section.label}</h3>
                  <p className="m-0 mt-1 text-[12px] text-[#7b89a3]">Live review and verification metadata</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {sectionEntries(section.values).map(([key, value]) => (
                  <div key={`${section.label}-${key}`} className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">
                      {key.replaceAll("_", " ")}
                    </p>
                    <p className="m-0 mt-2 break-words text-[13px] leading-6 text-[#1f2d46]">
                      {displayValue(key, value)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {pendingAction ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">
              Confirm {reviewActionTitle(pendingAction)}
            </h3>
            <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
              {pendingAction === "approve"
                ? `Approve ${vendor.businessName}? This service provider will be allowed to operate on the platform.`
                : pendingAction === "unblock"
                  ? `Unblock ${vendor.businessName}? This service provider will regain access to operate on the platform.`
                  : pendingAction === "cancel"
                    ? `Cancel the current review for ${vendor.businessName}? This will move the service provider back to pending review.`
                    : `Block ${vendor.businessName}? This service provider will lose access to operate on the platform.`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionBusy}
                className="inline-flex h-10 items-center rounded-xl border border-[#dbe2ef] px-4 text-[13px] font-medium text-[#4e5f83] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={actionBusy}
                className={`inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-white disabled:opacity-50 ${
                  pendingAction === "block" ? "bg-[#dc2626]" : pendingAction === "cancel" ? "bg-[#64748b]" : "bg-[#1f3d8f]"
                }`}
              >
                {actionBusy ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
