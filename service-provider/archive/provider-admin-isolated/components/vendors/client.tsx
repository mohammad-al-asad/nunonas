"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { IoAlertCircle, IoShieldCheckmark, IoTimeOutline } from "react-icons/io5";
import { FaUsers } from "react-icons/fa";
import { BsPatchCheckFill } from "react-icons/bs";

type VendorStatus = "PENDING" | "APPROVED" | "REJECTED";
type VendorCategory = "HOSPITALITY" | "DINING" | "RENTALS";

type VerificationDoc = {
  title: string;
  state: "Verified" | "Rejected";
};

type Vendor = {
  id: string;
  businessName: string;
  owner: string;
  category: VendorCategory;
  bookings: number;
  rating: number;
  status: VendorStatus;
  avatar: string;
  verification: {
    description: string;
    address: string;
    reviewScore: number;
    reviewCount: number;
    docs: VerificationDoc[];
  };
};

function vendorStatusClass(status: VendorStatus) {
  if (status === "APPROVED") return "bg-[#dcfce7] text-[#15803d]";
  if (status === "REJECTED") return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#fff4cc] text-[#b45309]";
}

const summaryIconByLabel: Record<string, { Icon: typeof FaUsers; tone: string }> = {
  "Total Vendors": { Icon: FaUsers, tone: "bg-[#edf2fb] text-[#1f3d8f]" },
  "Pending Approval": { Icon: IoTimeOutline, tone: "bg-[#fff7e5] text-[#f59e0b]" },
  "Approved Vendors": { Icon: IoShieldCheckmark, tone: "bg-[#e8f8ef] text-[#2da772]" },
  "Rejected Vendors": { Icon: IoAlertCircle, tone: "bg-[#feeeee] text-[#ef4444]" }
};

function safeImageSrc(src: string | null | undefined, fallbackSeed: string) {
  const value = typeof src === "string" ? src.trim() : "";
  return value || `https://i.pravatar.cc/120?u=${encodeURIComponent(fallbackSeed)}`;
}

export function VendorsManagementView({
  data
}: {
  data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; vendors: Vendor[] };
}) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [vendors, setVendors] = useState<Vendor[]>(data.vendors);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [pendingVendorAction, setPendingVendorAction] = useState<{
    vendorId: string;
    vendorName: string;
    action: "approve" | "block";
  } | null>(null);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | VendorStatus>("ALL");
  const pageSize = 5;

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [selectedVendorId, vendors]
  );

  useEffect(() => {
    if (statusParam === "PENDING" || statusParam === "APPROVED" || statusParam === "REJECTED") {
      setStatusFilter(statusParam);
      setPage(1);
    } else if (statusParam === "ALL") {
      setStatusFilter("ALL");
      setPage(1);
    }
  }, [statusParam]);

  const summaryCards = useMemo(() => {
    const total = vendors.length;
    const pending = vendors.filter((vendor) => vendor.status === "PENDING").length;
    const approved = vendors.filter((vendor) => vendor.status === "APPROVED").length;
    const rejected = vendors.filter((vendor) => vendor.status === "REJECTED").length;
    return data.summaryCards.map((card) => {
      if (card.label === "Total Vendors") return { ...card, value: total.toLocaleString() };
      if (card.label === "Pending Approval") return { ...card, value: pending.toLocaleString() };
      if (card.label === "Approved Vendors") return { ...card, value: approved.toLocaleString() };
      if (card.label === "Rejected Vendors") return { ...card, value: rejected.toLocaleString() };
      return card;
    });
  }, [data.summaryCards, vendors]);

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

  async function updateVendorStatus(id: string, action: "approve" | "block") {
    try {
      const res = await fetch(`/api/vendors/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!res.ok) return;
      const payload = (await res.json()) as { vendor?: Vendor };
      if (!payload.vendor) return;
      setVendors((prev) => prev.map((vendor) => (vendor.id === payload.vendor?.id ? payload.vendor : vendor)));
    } catch {
      // no-op for mock API
    }
  }

  const requestVendorAction = (vendor: Vendor, action: "approve" | "block") => {
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
              <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Export
              </button>
              {filtersOpen && (
                <div className="absolute right-5 top-14 z-10 w-40 rounded-lg border border-[#e6ecf7] bg-white p-2 text-[11px] text-[#3a4b70] shadow-sm">
                  {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
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
            <table className="w-full min-w-[880px] border-collapse text-[15px]">
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
                    "ACTIONS"
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
                        <Image
                          src={safeImageSrc(vendor.avatar, vendor.id || vendor.businessName)}
                          alt={vendor.businessName}
                          width={26}
                          height={26}
                          className="h-7 w-7 rounded object-cover"
                        />
                        <span className="text-[12px] font-semibold text-[#1f2d46]">{vendor.businessName}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#4f5f82]">{vendor.owner}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className="rounded bg-[#f1f5f9] px-2 py-1 text-[9px] font-semibold text-[#64748b]">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#2f3f60]">{(vendor.bookings ?? 0).toLocaleString()}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#f59e0b]">
                      <span className="inline-flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
                        </svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
                        </svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
                        </svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
                        </svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
                        </svg>
                      </span>
                      <span className="ml-2 text-[#7d8ba6]">{(vendor.rating ?? 0).toFixed(1)}</span>
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
                          aria-label={`Open ${vendor.businessName} verification`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M1.5 12s3.7-6.5 10.5-6.5S22.5 12 22.5 12s-3.7 6.5-10.5 6.5S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestVendorAction(vendor, "approve")}
                          className="grid h-6 w-6 place-items-center rounded-full border border-[#d7f2e3] text-[#16a34a]"
                          aria-label={`Approve ${vendor.businessName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestVendorAction(vendor, "block")}
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
          selectedVendor ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSelectedVendorId(null)}
        aria-hidden
      />

      <aside
        className={`fixed right-0 top-0 z-30 h-full w-full max-w-[320px] border-l border-[#e6ecf7] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition-transform duration-300 ${
          selectedVendor ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedVendor && (
          <div className="flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between bg-[#1f3d8f] -pl-1 px-5 py-4 text-white">
              <h4 className="m-0 text-[13px] font-semibold">Verification Detail</h4>
              <button type="button" onClick={() => setSelectedVendorId(null)} className="text-white">
                x
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col items-center">
                <Image
                  src={safeImageSrc(selectedVendor.avatar, selectedVendor.id || selectedVendor.businessName)}
                  alt={selectedVendor.businessName}
                  width={64}
                  height={64}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <h3 className="m-0 mt-3 text-[16px] font-semibold text-[#1d2a43]">{selectedVendor.businessName}</h3>
                <span className="mt-1 rounded-full bg-[#fff3d7] px-3 py-1 text-[9px] font-semibold text-[#b45309]">
                  {selectedVendor.status === "APPROVED" ? "APPROVED" : selectedVendor.status === "REJECTED" ? "REJECTED" : "PENDING VERIFICATION"}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                <section>
                  <div className="flex items-start gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Description</h5>
                      <p className="m-0 mt-1 text-[10px] leading-[1.45] text-[#60718f]">
                        {selectedVendor.verification.description}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-start gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 3.5c-3.2 0-5.5 2.4-5.5 5.6 0 4.2 5.5 10 5.5 10s5.5-5.8 5.5-10c0-3.2-2.3-5.6-5.5-5.6Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Address</h5>
                      <p className="m-0 mt-1 text-[10px] leading-[1.45] text-[#60718f]">{selectedVendor.verification.address}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Verification Documents</h5>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedVendor.verification.docs.map((doc) => (
                      <div key={doc.title} className="rounded-lg border border-[#e6ecf7] bg-white p-3">
                        <div className="grid h-10 place-items-center rounded bg-[#f2f5fb] text-[#9aabca]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M7 4h7l4 4v12H7V4Z" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.6" />
                          </svg>
                        </div>
                        <p className="m-0 mt-2 truncate text-[9px] font-semibold text-[#3f4f70]">{doc.title}</p>
                        <p className={`m-0 text-[9px] ${doc.state === "Verified" ? "text-[#16a34a]" : "text-[#ef4444]"}`}>{doc.state}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h5 className="m-0 text-[9px] tracking-[0.08em] text-[#8b96ad] uppercase">Reviews Summary</h5>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-[30px] leading-none text-[#1d2a43]">{(selectedVendor.verification.reviewScore ?? 0).toFixed(1)}</span>
                    <span className="text-[11px] text-[#f59e0b]">{"★".repeat(5)}</span>
                  </div>
                  <span className="mt-1 block text-[9px] text-[#8b96ad]">
                    Based on {(selectedVendor.verification.reviewCount ?? 0).toLocaleString()} verified reviews
                  </span>
                </section>
              </div>
            </div>

            <div className="mt-auto border-t border-[#e6ecf7] px-6 py-5">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => requestVendorAction(selectedVendor, "approve")}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1f3d8f] text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(31,61,143,0.25)]"
                >
                  <BsPatchCheckFill size={18}/>
                  Approve Vendor
                </button>
                <button
                  type="button"
                  onClick={() => requestVendorAction(selectedVendor, "block")}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#fee2e2] bg-[#fff5f5] text-[12px] font-semibold text-[#ef4444]"
                >
                  <IoAlertCircle size={16} />
                  Block Vendor
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {pendingVendorAction && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">
              Confirm {pendingVendorAction.action === "approve" ? "Approval" : "Block"}
            </h3>
            <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
              {pendingVendorAction.action === "approve"
                ? `Approve ${pendingVendorAction.vendorName}? This vendor will be allowed to operate on the platform.`
                : `Block ${pendingVendorAction.vendorName}? This vendor will be removed from active approval status.`}
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
                  pendingVendorAction.action === "approve" ? "bg-[#1f3d8f]" : "bg-[#dc2626]"
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
