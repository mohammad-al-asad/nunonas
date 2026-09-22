"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BsPatchCheckFill } from "react-icons/bs";
import { FaUsers } from "react-icons/fa";
import { IoAlertCircle, IoShieldCheckmark, IoTimeOutline } from "react-icons/io5";
import type {
  DashboardVendor,
  VendorCategory,
  VendorStatus,
  VendorVerificationDocument,
} from "@/lib/vendors-admin";

type VendorSummaryCard = { label: string; value: string; note: string; tone: string };

const pageSize = 5;
const vendorsRefreshIntervalMs = 30_000;
const drawerDefaultWidth = 420;
const drawerMinWidth = 380;
const drawerMaxWidth = 1100;

function primaryVendorAction(status: VendorStatus): "approve" | "unblock" {
  return status === "BLOCKED" ? "unblock" : "approve";
}

function primaryVendorActionLabel(status: VendorStatus) {
  return status === "BLOCKED" ? "Unblock Vendor" : "Approve Vendor";
}

function primaryVendorActionAriaLabel(vendorName: string, status: VendorStatus) {
  return `${status === "BLOCKED" ? "Unblock" : "Approve"} ${vendorName}`;
}

function vendorStatusClass(status: VendorStatus) {
  if (status === "APPROVED") return "bg-[#dcfce7] text-[#15803d]";
  if (status === "REJECTED" || status === "BLOCKED") return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#fff4cc] text-[#b45309]";
}

const summaryIconByLabel: Record<string, { Icon: typeof FaUsers; tone: string }> = {
  "Total Vendors": { Icon: FaUsers, tone: "bg-[#edf2fb] text-[#1f3d8f]" },
  "Pending Approval": { Icon: IoTimeOutline, tone: "bg-[#fff7e5] text-[#f59e0b]" },
  "Approved Vendors": { Icon: IoShieldCheckmark, tone: "bg-[#e8f8ef] text-[#2da772]" },
  "Blocked Vendors": { Icon: IoAlertCircle, tone: "bg-[#feeeee] text-[#ef4444]" },
};

function vendorInitials(vendor: DashboardVendor) {
  const source = vendor.businessName || vendor.owner || vendor.id;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "VN";
}

function renderAvatar(vendor: DashboardVendor, sizeClass: string) {
  if (vendor.avatar) {
    return (
      <Image
        src={vendor.avatar}
        alt={vendor.businessName}
        width={80}
        height={80}
        className={`${sizeClass} rounded object-cover`}
      />
    );
  }

  return (
    <div className={`grid ${sizeClass} place-items-center rounded bg-[#edf2fb] text-[12px] font-semibold text-[#415a91]`}>
      {vendorInitials(vendor)}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(value: string) {
  if (!value) return "Pending";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function stars(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => (
    <svg
      key={`star-${index}`}
      width="12"
      height="12"
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

function sectionEntries(section: Record<string, unknown>) {
  return Object.entries(section).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function isImageDocument(url: string) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url);
}

function isPdfDocument(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

async function fetchVendors(signal?: AbortSignal) {
  const response = await fetch("/api/vendors", { signal });
  if (!response.ok) {
    throw new Error("Failed to load vendors");
  }
  return (await response.json()) as { summaryCards: VendorSummaryCard[]; vendors: DashboardVendor[] };
}

async function fetchVendorDetail(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/vendors/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) {
    throw new Error("Failed to load vendor details");
  }
  const payload = (await response.json()) as { vendor?: DashboardVendor };
  return payload.vendor ?? null;
}

function syncSummaryCards(baseCards: VendorSummaryCard[], vendors: DashboardVendor[]) {
  const total = vendors.length;
  const pending = vendors.filter((vendor) => vendor.status === "PENDING").length;
  const approved = vendors.filter((vendor) => vendor.status === "APPROVED").length;
  const blocked = vendors.filter((vendor) => vendor.status === "BLOCKED").length;

  return baseCards.map((card) => {
    if (card.label === "Total Vendors") return { ...card, value: total.toLocaleString() };
    if (card.label === "Pending Approval") return { ...card, value: pending.toLocaleString() };
    if (card.label === "Approved Vendors") return { ...card, value: approved.toLocaleString() };
    if (card.label === "Blocked Vendors") return { ...card, value: blocked.toLocaleString() };
    return card;
  });
}

function DocumentsGrid({ docs }: { docs: VendorVerificationDocument[] }) {
  const [activeDoc, setActiveDoc] = useState<VendorVerificationDocument | null>(null);
  const [zoom, setZoom] = useState(1);

  if (docs.length === 0) {
    return <p className="mt-2 text-[11px] text-[#8b96ad]">No verification documents uploaded.</p>;
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {docs.map((doc) => (
          <button
            key={`${doc.title}-${doc.url}`}
            type="button"
            onClick={() => {
              setActiveDoc(doc);
              setZoom(1);
            }}
            className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white text-left transition hover:border-[#bfd0f7] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
          >
            <div className="grid gap-0">
              {isImageDocument(doc.url) ? (
                <div className="bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] p-3">
                  <img
                    src={doc.url}
                    alt={doc.title}
                    className="h-40 w-full rounded-xl border border-[#dde7f5] object-cover"
                  />
                </div>
              ) : (
                <div className="grid h-32 place-items-center bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] text-[#6b7b99]">
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7 4h7l4 4v12H7V4Z" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </div>
                    <p className="m-0 mt-3 text-[11px] font-semibold">Open document</p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="m-0 text-[11px] font-semibold text-[#1f2d46]">{doc.title}</p>
                  <p className="m-0 mt-1 text-[10px] text-[#7b89a3]">
                    {isImageDocument(doc.url) ? "Image preview available" : "Open inside dashboard"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
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
          <div className="flex h-[min(88vh,900px)] w-[min(92vw,1100px)] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
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
                  className="h-full min-h-[640px] w-full rounded-2xl border border-[#dbe2ef] bg-white"
                />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center">
                  <div className="max-w-md rounded-3xl border border-[#dbe2ef] bg-white p-8 text-center">
                    <p className="m-0 text-[16px] font-semibold text-[#1d2a43]">Preview unavailable</p>
                    <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
                      This document type cannot be embedded in the viewer yet.
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

export function VendorsManagementView({
  data,
}: {
  data: { summaryCards: VendorSummaryCard[]; vendors: DashboardVendor[] };
}) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [vendors, setVendors] = useState<DashboardVendor[]>(data.vendors);
  const [baseSummaryCards, setBaseSummaryCards] = useState<VendorSummaryCard[]>(data.summaryCards);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<DashboardVendor | null>(null);
  const [selectedVendorLoading, setSelectedVendorLoading] = useState(false);
  const [selectedVendorError, setSelectedVendorError] = useState<string | null>(null);
  const [pendingVendorAction, setPendingVendorAction] = useState<{
    vendorId: string;
    vendorName: string;
    action: "approve" | "block" | "unblock";
  } | null>(null);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | VendorStatus>("ALL");
  const [drawerWidth, setDrawerWidth] = useState(drawerDefaultWidth);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const dragFrameRef = useRef<number | null>(null);

  const selectedVendorFallback = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [selectedVendorId, vendors],
  );
  const selectedVendor = selectedVendorDetail ?? selectedVendorFallback;

  useEffect(() => {
    if (!selectedVendorId) {
      setDrawerWidth(drawerDefaultWidth);
    }
  }, [selectedVendorId]);

  useEffect(() => {
    if (!isDraggingDrawer) {
      return;
    }

    const updateWidth = (clientX: number) => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        const viewportWidth = window.innerWidth;
        const nextWidth = Math.min(
          drawerMaxWidth,
          Math.max(drawerMinWidth, viewportWidth - clientX),
        );
        setDrawerWidth(nextWidth);
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateWidth(event.clientX);
    };

    const stopDragging = () => {
      setIsDraggingDrawer(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };
  }, [isDraggingDrawer]);

  useEffect(() => {
    if (statusParam === "PENDING" || statusParam === "APPROVED" || statusParam === "REJECTED" || statusParam === "BLOCKED") {
      setStatusFilter(statusParam);
      setPage(1);
    } else if (statusParam === "ALL") {
      setStatusFilter("ALL");
      setPage(1);
    }
  }, [statusParam]);

  const summaryCards = useMemo(() => syncSummaryCards(baseSummaryCards, vendors), [baseSummaryCards, vendors]);

  const filteredVendors = useMemo(() => {
    if (statusFilter === "ALL") return vendors;
    return vendors.filter((vendor) => vendor.status === statusFilter);
  }, [statusFilter, vendors]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedVendors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVendors.slice(start, start + pageSize);
  }, [currentPage, filteredVendors]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];

    if (currentPage <= 3) {
      items.push(2, 3, "ellipsis", totalPages);
      return items;
    }

    if (currentPage >= totalPages - 2) {
      items.push("ellipsis", totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
    return items;
  }, [currentPage, totalPages]);

  useEffect(() => {
    const refreshVendors = async (signal?: AbortSignal) => {
      try {
        const payload = await fetchVendors(signal);
        if (Array.isArray(payload.vendors)) {
          setVendors(payload.vendors);
        }
        if (Array.isArray(payload.summaryCards)) {
          setBaseSummaryCards(payload.summaryCards);
        }
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          return;
        }
      }
    };

    const controller = new AbortController();
    void refreshVendors(controller.signal);

    const intervalId = window.setInterval(() => {
      void refreshVendors();
    }, vendorsRefreshIntervalMs);

    const handleWindowRefresh = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void refreshVendors();
    };

    window.addEventListener("focus", handleWindowRefresh);
    document.addEventListener("visibilitychange", handleWindowRefresh);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowRefresh);
      document.removeEventListener("visibilitychange", handleWindowRefresh);
    };
  }, []);

  useEffect(() => {
    setVendors(data.vendors);
    setBaseSummaryCards(data.summaryCards);
  }, [data.summaryCards, data.vendors]);

  useEffect(() => {
    if (!selectedVendorId) {
      setSelectedVendorDetail(null);
      setSelectedVendorError(null);
      setSelectedVendorLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadSelectedVendor = async (signal?: AbortSignal) => {
      setSelectedVendorLoading(true);
      setSelectedVendorError(null);
      try {
        const vendor = await fetchVendorDetail(selectedVendorId, signal);
        setSelectedVendorDetail(vendor);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setSelectedVendorError("Failed to load live vendor details.");
        }
      } finally {
        setSelectedVendorLoading(false);
      }
    };

    void loadSelectedVendor(controller.signal);

    const intervalId = window.setInterval(() => {
      void loadSelectedVendor();
    }, vendorsRefreshIntervalMs);

    const handleWindowRefresh = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadSelectedVendor();
    };

    window.addEventListener("focus", handleWindowRefresh);
    document.addEventListener("visibilitychange", handleWindowRefresh);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowRefresh);
      document.removeEventListener("visibilitychange", handleWindowRefresh);
    };
  }, [selectedVendorId]);

  async function updateVendorStatus(id: string, action: "approve" | "block" | "unblock") {
    const nextAction = action === "unblock" ? "approve" : action;
    try {
      const res = await fetch(`/api/vendors/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction }),
      });
      if (!res.ok) {
        throw new Error("Failed to update vendor");
      }

      const refreshed = await fetchVendors();
      if (Array.isArray(refreshed.vendors)) {
        setVendors(refreshed.vendors);
      }
      if (Array.isArray(refreshed.summaryCards)) {
        setBaseSummaryCards(refreshed.summaryCards);
      }
      if (selectedVendorId === id) {
        const detail = await fetchVendorDetail(id).catch(() => null);
        setSelectedVendorDetail(detail);
      }
    } catch {
      const refreshed = await fetchVendors().catch(() => null);
      if (refreshed?.vendors) {
        setVendors(refreshed.vendors);
      }
      if (refreshed?.summaryCards) {
        setBaseSummaryCards(refreshed.summaryCards);
      }
    }
  }

  const requestVendorAction = (vendor: DashboardVendor, action: "approve" | "block" | "unblock") => {
    setPendingVendorAction({
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      action,
    });
  };

  const confirmVendorAction = async () => {
    if (!pendingVendorAction) {
      return;
    }
    const { vendorId, action } = pendingVendorAction;
    setPendingVendorAction(null);
    await updateVendorStatus(vendorId, action);
  };

  return (
    <section className="relative space-y-6">
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const { Icon, tone } = summaryIconByLabel[card.label] ?? summaryIconByLabel["Total Vendors"];
            return (
              <article
                key={card.label}
                className="min-h-[120px] rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <p className="m-0 text-[12px] text-[#6b7b99]">{card.label}</p>
                  <div className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <h3 className="m-0 text-[30px] leading-none text-[#1d2a43]">{card.value}</h3>
                <p className={`m-0 mt-2 text-[11px] ${card.tone}`}>{card.note}</p>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e6ecf7] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
            <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Vendor Directory</h3>
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Filter
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-14 z-10 w-40 rounded-lg border border-[#e6ecf7] bg-white p-2 text-[11px] text-[#3a4b70] shadow-sm">
                  {(["ALL", "PENDING", "APPROVED", "BLOCKED"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                        setFiltersOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                        statusFilter === status ? "bg-[#f3f6fd] font-semibold text-[#1f3d8f]" : ""
                      }`}
                    >
                      {status === "ALL" ? "All vendors" : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[980px] border-collapse text-[15px]">
              <thead>
                <tr>
                  {[
                    "VENDOR ID",
                    "BUSINESS NAME",
                    "OWNER",
                    "CATEGORY",
                    "BOOKINGS",
                    "RATING",
                    "STATUS",
                    "ACTIONS",
                  ].map((head) => (
                    <th
                      key={head}
                      className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.06em] text-[#7d8ba6]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedVendors.map((vendor, index) => (
                  <tr key={vendor.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[11px] font-semibold text-[#2d3f62]">{vendor.id}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-3">
                        {renderAvatar(vendor, "h-7 w-7")}
                        <div className="min-w-0">
                          <Link
                            href={`/vendors/${vendor.id}`}
                            className="block truncate text-[12px] font-semibold text-[#1f2d46] hover:text-[#1f3d8f] hover:underline"
                          >
                            {vendor.businessName}
                          </Link>
                          <span className="block truncate text-[10px] text-[#7d8ba6]">
                            {vendor.email || vendor.phone || "No contact info"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#4f5f82]">{vendor.owner}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className="rounded bg-[#f1f5f9] px-2 py-1 text-[9px] font-semibold text-[#64748b]">
                        {vendor.category as VendorCategory}
                      </span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#2f3f60]">{vendor.bookings.toLocaleString()}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className="inline-flex items-center gap-1">{stars(vendor.rating)}</span>
                      <span className="ml-2 text-[#7d8ba6]">{vendor.rating.toFixed(1)}</span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${vendorStatusClass(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVendorId(vendor.id)}
                          className="grid h-6 w-6 place-items-center rounded-full border border-[#e6ecf7] text-[#64748b]"
                          aria-label={`Open ${vendor.businessName} details`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M1.5 12s3.7-6.5 10.5-6.5S22.5 12 22.5 12s-3.7 6.5-10.5 6.5S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestVendorAction(vendor, primaryVendorAction(vendor.status))}
                          disabled={vendor.status === "APPROVED"}
                          className="grid h-6 w-6 place-items-center rounded-full border border-[#d7f2e3] text-[#16a34a]"
                          aria-label={primaryVendorActionAriaLabel(vendor.businessName, vendor.status)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestVendorAction(vendor, "block")}
                          disabled={vendor.status === "BLOCKED"}
                          className="grid h-6 w-6 place-items-center rounded-full border border-[#fde2e2] text-[#ef4444]"
                          aria-label={`Block ${vendor.businessName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M8 16L16 8" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex items-center justify-between px-5 py-4 text-[11px] text-[#8b96ad]">
            <span>
              Showing {filteredVendors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredVendors.length)} of {filteredVendors.length} vendors
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className={`rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] ${
                  currentPage === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
                }`}
                aria-disabled={currentPage === 1}
              >
                Previous
              </button>
              {paginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <span key={`ellipsis-${index}`} className="px-1 text-[10px] text-[#94a3b8]">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`h-6 w-6 rounded text-[11px] ${
                      item === currentPage ? "bg-[#1f3d8f] text-white" : "border border-[#e6ecf7] text-[#64748b]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className={`rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] ${
                  currentPage === totalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
                }`}
                aria-disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </div>

      <div
        className={`fixed inset-0 z-20 bg-black/40 transition-opacity ${
          selectedVendorId ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSelectedVendorId(null)}
        aria-hidden
      />

      <aside
        className={`fixed right-0 top-0 z-30 h-full border-l border-[#e6ecf7] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] ${
          isDraggingDrawer ? "" : "transition-[width,transform] duration-300"
        } ${
          selectedVendorId ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: `${drawerWidth}px`, maxWidth: "100vw" }}
      >
        <button
          type="button"
          aria-label="Resize vendor details panel"
          onPointerDown={(event) => {
            event.preventDefault();
            setIsDraggingDrawer(true);
          }}
          className="absolute left-0 top-0 z-40 h-full w-3 -translate-x-1/2 cursor-col-resize bg-transparent"
        />
        <div className="flex h-full flex-col overflow-hidden">
          <header className="flex items-center justify-between bg-[#1f3d8f] px-5 py-4 text-white">
            <div>
              <h4 className="m-0 text-[13px] font-semibold">Vendor Details</h4>
              <p className="m-0 mt-1 text-[11px] text-white/75">Live data from the backend</p>
            </div>
            <button type="button" onClick={() => setSelectedVendorId(null)} className="text-white">
              x
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {selectedVendorLoading && !selectedVendor ? (
              <p className="text-[13px] text-[#60718f]">Loading vendor details...</p>
            ) : selectedVendorError && !selectedVendor ? (
              <p className="text-[13px] text-[#dc2626]">{selectedVendorError}</p>
            ) : selectedVendor ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  {renderAvatar(selectedVendor, "h-16 w-16")}
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 truncate text-[18px] font-semibold text-[#1d2a43]">{selectedVendor.businessName}</h3>
                    <p className="m-0 mt-1 text-[12px] text-[#60718f]">{selectedVendor.owner}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${vendorStatusClass(selectedVendor.status)}`}>
                        {selectedVendor.status}
                      </span>
                      <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[10px] font-semibold text-[#1f3d8f]">
                        {statusLabel(selectedVendor.verification.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <section className="overflow-hidden rounded-3xl border border-[#e6ecf7] bg-[linear-gradient(180deg,#fbfdff_0%,#f7f9fc_100%)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="m-0 text-[11px] font-semibold text-[#1d2a43]">Verification documents</p>
                      <p className="m-0 mt-1 text-[10px] text-[#7b89a3]">Live previews from backend document URLs</p>
                    </div>
                    <Link href={`/vendors/${selectedVendor.id}`} className="text-[11px] font-semibold text-[#1f3d8f]">
                      Open full page
                    </Link>
                  </div>
                  <DocumentsGrid docs={selectedVendor.verification.docs} />
                </section>

                <section className="grid gap-3">
                  <div>
                    <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Contact</h5>
                    <p className="m-0 mt-1 text-[12px] text-[#1f2d46]">{selectedVendor.email || "No email provided"}</p>
                    <p className="m-0 mt-1 text-[12px] text-[#60718f]">{selectedVendor.phone || "No phone provided"}</p>
                  </div>
                  <div>
                    <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Address</h5>
                    <p className="m-0 mt-1 text-[12px] leading-5 text-[#60718f]">{selectedVendor.verification.address}</p>
                  </div>
                  <div>
                    <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Description</h5>
                    <p className="m-0 mt-1 text-[12px] leading-5 text-[#60718f]">{selectedVendor.verification.description}</p>
                  </div>
                </section>

                <section>
                  <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Review summary</h5>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-[30px] leading-none text-[#1d2a43]">{selectedVendor.verification.reviewScore.toFixed(1)}</span>
                    <span className="flex items-center gap-1">{stars(selectedVendor.verification.reviewScore)}</span>
                  </div>
                  <span className="mt-1 block text-[10px] text-[#8b96ad]">
                    Based on {selectedVendor.verification.reviewCount.toLocaleString()} verified reviews
                  </span>
                </section>

                {selectedVendor.verification.rejectionReason ? (
                  <section className="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] p-4">
                    <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#dc2626]">Rejection reason</h5>
                    <p className="m-0 mt-2 text-[12px] leading-5 text-[#b91c1c]">{selectedVendor.verification.rejectionReason}</p>
                  </section>
                ) : null}

                <section className="grid gap-3">
                  <div className="rounded-2xl border border-[#e6ecf7] bg-[#f8fafc] p-4">
                    <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Quick facts</h5>
                    <div className="mt-3 grid gap-3">
                      <div>
                        <p className="m-0 text-[10px] uppercase tracking-[0.06em] text-[#94a3b8]">Category</p>
                        <p className="m-0 mt-1 text-[12px] text-[#1f2d46]">{selectedVendor.category}</p>
                      </div>
                      <div>
                        <p className="m-0 text-[10px] uppercase tracking-[0.06em] text-[#94a3b8]">Vendor ID</p>
                        <p className="m-0 mt-1 break-all text-[12px] text-[#1f2d46]">{selectedVendor.id}</p>
                      </div>
                      <div>
                        <p className="m-0 text-[10px] uppercase tracking-[0.06em] text-[#94a3b8]">Last updated</p>
                        <p className="m-0 mt-1 text-[12px] text-[#1f2d46]">{formatDate(selectedVendor.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedVendor.verification.rejectionReason ? (
                    <div className="rounded-2xl border border-[#fee2e2] bg-[#fff5f5] p-4">
                      <h5 className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#dc2626]">Review note</h5>
                      <p className="m-0 mt-2 text-[12px] leading-5 text-[#b91c1c]">
                        {selectedVendor.verification.rejectionReason}
                      </p>
                    </div>
                  ) : null}
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#e6ecf7] p-4">
                    <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Created</p>
                    <p className="m-0 mt-2 text-[12px] text-[#1f2d46]">{formatDate(selectedVendor.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6ecf7] p-4">
                    <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#8b96ad]">Last updated</p>
                    <p className="m-0 mt-2 text-[12px] text-[#1f2d46]">{formatDate(selectedVendor.updatedAt)}</p>
                  </div>
                </section>
              </div>
            ) : (
              <p className="text-[13px] text-[#60718f]">Select a vendor to load live details.</p>
            )}
          </div>

          {selectedVendor ? (
            <div className="mt-auto border-t border-[#e6ecf7] px-6 py-5">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => requestVendorAction(selectedVendor, primaryVendorAction(selectedVendor.status))}
                  disabled={selectedVendor.status === "APPROVED"}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1f3d8f] text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(31,61,143,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BsPatchCheckFill size={18} />
                  {primaryVendorActionLabel(selectedVendor.status)}
                </button>
                <button
                  type="button"
                  onClick={() => requestVendorAction(selectedVendor, "block")}
                  disabled={selectedVendor.status === "BLOCKED"}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#fee2e2] bg-[#fff5f5] text-[12px] font-semibold text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IoAlertCircle size={16} />
                  Block Vendor
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {pendingVendorAction && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">
              Confirm {pendingVendorAction.action === "block" ? "Block" : pendingVendorAction.action === "unblock" ? "Unblock" : "Approval"}
            </h3>
            <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
              {pendingVendorAction.action === "approve"
                ? `Approve ${pendingVendorAction.vendorName}? This vendor will be allowed to operate on the platform.`
                : pendingVendorAction.action === "unblock"
                  ? `Unblock ${pendingVendorAction.vendorName}? This vendor will regain access to operate on the platform.`
                  : `Block ${pendingVendorAction.vendorName}? This vendor will lose access to operate on the platform.`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingVendorAction(null)}
                className="inline-flex h-10 items-center rounded-xl border border-[#dbe2ef] px-4 text-[13px] font-medium text-[#4e5f83]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmVendorAction}
                className={`inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-white ${
                  pendingVendorAction.action === "block" ? "bg-[#dc2626]" : "bg-[#1f3d8f]"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
