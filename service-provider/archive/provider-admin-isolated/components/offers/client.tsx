"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaRegCreditCard, FaShoppingCart } from "react-icons/fa";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiFilter,
  FiMoreVertical,
  FiPauseCircle,
  FiPlus,
  FiX,
  FiTrash2,
  FiSearch,
  FiTag,
  FiEye,
  FiUsers,
  FiRepeat,
  FiUserCheck,
  FiZap,
  FiGift
} from "react-icons/fi";

type OfferStatus = "Active" | "Inactive";
type DiscountKind = "PERCENT" | "FLAT" | "BOGO";

type Offer = {
  id: string;
  name: string;
  discount: string;
  validity: string;
  appliedTo: string;
  status: OfferStatus;
  redemptions: number;
  kind: DiscountKind;
  startDate: string;
  endDate: string;
  discountValue: number;
  providerCount: number;
  engagedUsers: number;
  providerBreakdown: Array<{
    providerId: string;
    providerName: string;
    vendorCategory: string;
    status: string;
    redemptions: number;
    engagedUsers: number;
    active: boolean;
  }>;
};

function offerStatusClass(status: OfferStatus) {
  if (status === "Active") return "bg-[#dcfce7] text-[#15803d]";
  return "bg-[#e2e8f0] text-[#64748b]";
}

function offerKindIcon(kind: DiscountKind) {
  if (kind === "FLAT") return <FiZap size={12} />;
  if (kind === "BOGO") return <FiGift size={12} />;
  return <FiTag size={12} />;
}

const pageSize = 5;

export function OffersManagementView({
  data
}: {
  data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; offers: Offer[] };
}) {
  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [offers, setOffers] = useState<Offer[]>(data.offers);
  const [discountFilter, setDiscountFilter] = useState<"ALL" | "PERCENT" | "FLAT" | "BOGO">("ALL");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOffer, setDetailsOffer] = useState<Offer | null>(null);
  const [deleteConfirmOffer, setDeleteConfirmOffer] = useState<Offer | null>(null);
  const [pauseConfirmOffer, setPauseConfirmOffer] = useState<Offer | null>(null);
  const [providerCategory, setProviderCategory] = useState("All Categories");
  const [providerSearch, setProviderSearch] = useState("");
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [providerRows, setProviderRows] = useState<
    Array<{
      providerId: string;
      providerName: string;
      vendorCategory: string;
      status: string;
      redemptions: number;
      engagedUsers: number;
      active: boolean;
    }>
  >([]);
  const [applyMenuOpen, setApplyMenuOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [formName, setFormName] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENT" | "FLAT" | "BOGO">("PERCENT");
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formApplyTo, setFormApplyTo] = useState("All Vendors");
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [editOfferId, setEditOfferId] = useState<string | null>(null);

  const formatDateDisplay = (value: string) => {
    if (!value) return "mm/dd/yyyy";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${month}/${day}/${year}`;
  };

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    if (typeof ref.current.showPicker === "function") {
      ref.current.showPicker();
      return;
    }
    ref.current.focus();
    ref.current.click();
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-offer-menu]") || target?.closest("[data-offer-menu-panel]")) return;
      if (target?.closest("[data-offer-filter]")) return;
      if (target?.closest("[data-offer-create]")) return;
      if (target?.closest("[data-offer-apply]")) return;
      if (target?.closest("[data-offer-details]")) return;
      if (target?.closest("[data-offer-delete]")) return;
      if (target?.closest("[data-offer-pause]")) return;
      if (target?.closest("[data-offer-provider]")) return;
      setOpenMenuId(null);
      setFilterMenuOpen(false);
      setApplyMenuOpen(false);
      setDetailsOpen(false);
      setDeleteConfirmOffer(null);
      setPauseConfirmOffer(null);
      setProviderMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    if (!openMenuId) return;

    const updatePlacement = () => {
      const root = document.querySelector(
        `[data-offer-menu-id="${openMenuId}"]`
      ) as HTMLElement | null;
      const button = root?.querySelector("[data-offer-menu-button]") as HTMLElement | null;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const panelRect = menuPanelRef.current?.getBoundingClientRect();
      const panelHeight = panelRect?.height ?? 0;
      const panelWidth = 160;
      const offset = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placeTop = spaceBelow < panelHeight + offset && spaceAbove > spaceBelow;
      const top = placeTop ? rect.top - panelHeight - offset : rect.bottom + offset;
      const left = Math.min(
        window.innerWidth - offset - panelWidth,
        Math.max(offset, rect.right - panelWidth)
      );

      setMenuPosition({ top, left });
    };

    const raf = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [openMenuId]);

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = normalizedQuery
      ? offers.filter((offer) => offer.name.toLowerCase().includes(normalizedQuery))
      : offers;
    if (discountFilter === "ALL") return base;
    return base.filter((offer) => offer.kind === discountFilter);
  }, [offers, query, discountFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / pageSize));
  const pagedOffers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, page]);
  const providerCategoryOptions = useMemo(() => {
    const categories = new Set<string>();
    providerRows.forEach((row) => {
      if (row.vendorCategory) categories.add(row.vendorCategory);
    });
    return ["All Categories", ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [providerRows]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];

    if (page <= 3) {
      items.push(2, 3, "ellipsis", totalPages);
      return items;
    }

    if (page >= totalPages - 2) {
      items.push("ellipsis", totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
    return items;
  }, [page, totalPages]);

  const resetCreateForm = () => {
    setFormName("");
    setFormDiscountType("PERCENT");
    setFormDiscountValue(0);
    setFormStartDate("");
    setFormEndDate("");
    setFormApplyTo("All Vendors");
    setFormActive(true);
    setFormError("");
    setApplyMenuOpen(false);
    setEditOfferId(null);
  };

  const openEditOffer = (offer: Offer) => {
    setFormName(offer.name);
    setFormDiscountType(offer.kind);
    setFormDiscountValue(offer.kind === "BOGO" ? 0 : offer.discountValue);
    setFormStartDate(offer.startDate ? offer.startDate.slice(0, 10) : "");
    setFormEndDate(offer.endDate ? offer.endDate.slice(0, 10) : "");
    setFormApplyTo(offer.appliedTo);
    setFormActive(offer.status === "Active");
    setFormError("");
    setEditOfferId(offer.id);
    setCreateOpen(true);
  };

  const openDetails = (offerId: string | null) => {
    if (!offerId) return;
    const found = offers.find((offer) => offer.id === offerId) ?? null;
    setDetailsOffer(found);
    setProviderRows(found?.providerBreakdown ?? []);
    setDetailsOpen(true);
    setProviderCategory("All Categories");
    setProviderSearch("");
    setProviderMenuOpen(false);
  };

  const handleCreateOffer = async () => {
    if (!formName.trim() || createSaving) return;
    setFormError("");
    setCreateSaving(true);
    try {
      const response = await fetch("/api/offers", {
        method: editOfferId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editOfferId,
          name: formName.trim(),
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          startDate: formStartDate,
          endDate: formEndDate,
          appliedTo: formApplyTo,
          active: formActive
        })
      });
      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => ({}))) as {
          detail?: string;
          message?: string;
          error?: string;
        };
        throw new Error(
          errorPayload.detail ||
          errorPayload.message ||
          errorPayload.error ||
          "Failed to create offer"
        );
      }
      const payload = (await response.json()) as { offer: Offer; offers: Offer[] };
      if (payload?.offers?.length) {
        setOffers(payload.offers);
      } else if (payload?.offer) {
        setOffers((prev) => [payload.offer, ...prev]);
      }
      setCreateOpen(false);
      resetCreateForm();
      setPage(1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create offer");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    const nextActive = offer.status !== "Active";
    const response = await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: offer.id, active: nextActive })
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { offers: Offer[] };
    if (payload?.offers?.length) setOffers(payload.offers);
  };

  const handleDeleteOffer = async (offer: Offer) => {
    const response = await fetch("/api/offers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: offer.id })
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { offers: Offer[] };
    if (payload?.offers?.length) setOffers(payload.offers);
    if (detailsOffer?.id === offer.id) setDetailsOpen(false);
    setDeleteConfirmOffer(null);
  };

  return (
    <section className="space-y-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-[#e6ecf7] bg-gray-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-[#1d2a43]">Offers</h2>
          <p className="m-0 mt-1 text-base text-[#2b3a59]">
            Manage and monitor promotional campaign performance across all regions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#1f3d8f] px-4 py-3 text-[12px] font-semibold text-white shadow-md shadow-[#1f3d8f]/20"
        >
          <span className="grid size-5  place-items-center rounded-full bg-white/15">
            <FiPlus size={10} />
          </span>
          Create Offer
        </button>
      </section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {data.summaryCards.map((card, index) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef2ff] text-[#1f3d8f]">
                {index === 0 && <FaCheckCircle  size={18} />}
                {index === 1 && <FiClock size={18} />}
                {index === 2 && <FaShoppingCart  size={18} />}
                {index === 3 && <FaRegCreditCard size={18} />}
              </div>
              <span className={`text-[10px] font-semibold ${card.tone}`}>{card.note}</span>
            </div>
            <p className="m-0 text-[10px] tracking-[0.04em] text-[#7d8ba6]">{card.label}</p>
            <h3 className="m-0 mt-1 text-[28px] leading-none text-[#1d2a43]">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h3 className="m-0 text-[15px] font-semibold text-[#1d2a43]">Offer Listings</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-8 min-w-[220px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
              <FiSearch size={12} className="text-[#8b96ad]" />
              <input
                type="text"
                placeholder="Search offers..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
              />
            </div>
            <div className="relative" data-offer-filter>
              <button
                type="button"
                onClick={() => setFilterMenuOpen((current) => !current)}
                className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] ${
                  discountFilter !== "ALL"
                    ? "border-[#c7d2fe] bg-[#eef2ff] text-[#1f3d8f]"
                    : "border-[#e6ecf7] bg-white text-[#3a4b70]"
                }`}
              >
                <FiFilter size={12} />
                Filter
                {discountFilter !== "ALL" && (
                  <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1f3d8f] px-1 text-[9px] font-semibold text-white">
                    1
                  </span>
                )}
              </button>
              {filterMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-[#e6ecf7] bg-white shadow-lg">
                  {[
                    { value: "ALL", label: "All Discounts" },
                    { value: "PERCENT", label: "Percent" },
                    { value: "FLAT", label: "Flat" },
                    { value: "BOGO", label: "BOGO" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setDiscountFilter(option.value as typeof discountFilter);
                        setPage(1);
                        setFilterMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                        discountFilter === option.value ? "text-[#1f3d8f]" : "text-[#475569]"
                      }`}
                    >
                      {option.label}
                      {discountFilter === option.value && <span className="text-[10px]">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead>
              <tr>
                {[
                  "OFFER NAME",
                  "DISCOUNT",
                  "VALIDITY PERIOD",
                  "APPLIED TO",
                  "STATUS",
                  "REDEMPTIONS",
                  "ACTIONS"
                ].map((head) => (
                  <th
                    key={head}
                    className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedOffers.map((offer, index) => (
                <tr key={offer.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#edf2fb] text-[#1f3d8f]">
                        {offerKindIcon(offer.kind)}
                      </div>
                      <span className="text-[13px] font-semibold text-[#1f2d46]">{offer.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{offer.discount}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#7d8ba6]">{offer.validity}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[9px] text-[#64748b]">{offer.appliedTo}</span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${offerStatusClass(offer.status)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${offer.status === "Active" ? "bg-[#16a34a]" : "bg-[#94a3b8]"}`} />
                      {offer.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[#2f3f60]">{offer.redemptions.toLocaleString()}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="relative" data-offer-menu data-offer-menu-id={offer.id}>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]"
                        aria-label={`Open actions for ${offer.name}`}
                        onClick={() =>
                          setOpenMenuId((current) => (current === offer.id ? null : offer.id))
                        }
                        data-offer-menu-button
                      >
                        <FiMoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {openMenuId && menuPosition &&
          createPortal(
            <div
              ref={menuPanelRef}
              data-offer-menu-panel
              style={{ top: menuPosition.top, left: menuPosition.left }}
              className="fixed z-50 w-40 overflow-hidden rounded-lg border border-[#e6ecf7] bg-white shadow-lg"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#475569] hover:bg-[#f8fafc]"
                onClick={() => {
                  openDetails(openMenuId);
                  setOpenMenuId(null);
                }}
              >
                <FiEye size={13} />
                View Details
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#475569] hover:bg-[#f8fafc]"
                onClick={() => {
                  const offer = offers.find((item) => item.id === openMenuId);
                  if (offer) openEditOffer(offer);
                  setOpenMenuId(null);
                }}
              >
                <FiEdit2 size={13} />
                Edit Offer
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#1f3d8f] hover:bg-[#f8fafc]"
                onClick={() => {
                  const offer = offers.find((item) => item.id === openMenuId);
                  if (offer) handleToggleStatus(offer);
                  setOpenMenuId(null);
                }}
              >
                <FiPauseCircle size={13} />
                {offers.find((item) => item.id === openMenuId)?.status === "Active"
                  ? "Pause Campaign"
                  : "Resume Campaign"}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-[#ef4444] hover:bg-[#fef2f2]"
                onClick={() => {
                  const offer = offers.find((item) => item.id === openMenuId);
                  if (offer) setDeleteConfirmOffer(offer);
                  setOpenMenuId(null);
                }}
              >
                <FiTrash2 size={13} />
                Delete
              </button>
            </div>,
            document.body
          )}
        {createOpen &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40 bg-[#0f172a]/30"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
              />
              <aside
                className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto bg-white shadow-2xl"
                data-offer-create
              >
                <header className="flex items-center justify-between border-b border-[#edf1fa] px-5 py-4">
                  <h3 className="m-0 text-[16px] font-semibold text-[#1d2a43]">
                    {editOfferId ? "Edit Offer" : "Create New Offer"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateOpen(false);
                      resetCreateForm();
                    }}
                    className="text-[#94a3b8]"
                    aria-label="Close create offer"
                  >
                    <FiX size={16} />
                  </button>
                </header>
                <form
                  className="space-y-4 px-5 py-4 text-[11px] text-[#475569]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleCreateOffer();
                  }}
                >
                  {formError && (
                    <div className="rounded-xl border border-[#fde2e2] bg-[#fff5f5] px-3 py-2 text-[11px] text-[#dc2626]">
                      {formError}
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] font-semibold text-[#334155]">Offer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Winter Holiday Special"
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#1f2d46] placeholder:text-[#94a3b8] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">Discount Type</label>
                      <div className="mt-2 grid h-[46px] grid-cols-3 items-center rounded-xl border border-[#e6ecf7] bg-[#f8fafc] p-1">
                        <button
                          type="button"
                          onClick={() => setFormDiscountType("PERCENT")}
                          className={`flex h-full items-center justify-center rounded-lg px-2 text-center text-[10px] font-semibold leading-none ${
                            formDiscountType === "PERCENT"
                              ? "bg-white text-[#1f3d8f] shadow-sm"
                              : "text-[#64748b]"
                          }`}
                        >
                          Percentage
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDiscountType("FLAT")}
                          className={`flex h-full items-center justify-center rounded-lg px-2 text-center text-[10px] font-semibold leading-none ${
                            formDiscountType === "FLAT"
                              ? "bg-white text-[#1f3d8f] shadow-sm"
                              : "text-[#64748b]"
                          }`}
                        >
                          Flat Amount
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDiscountType("BOGO")}
                          className={`flex h-full items-center justify-center rounded-lg px-2 text-center text-[10px] font-semibold leading-none ${
                            formDiscountType === "BOGO"
                              ? "bg-white text-[#1f3d8f] shadow-sm"
                              : "text-[#64748b]"
                          }`}
                        >
                          BOGO
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">Discount Value</label>
                      <div className="mt-2 flex h-[46px] items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3">
                        <input
                          type="number"
                          value={formDiscountType === "BOGO" ? "" : formDiscountValue === 0 ? "" : String(formDiscountValue)}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setFormDiscountValue(nextValue === "" ? 0 : Number(nextValue));
                          }}
                          disabled={formDiscountType === "BOGO"}
                          placeholder={formDiscountType === "BOGO" ? "BOGO" : "Enter value"}
                          className="w-full border-0 bg-transparent text-[11px] text-[#1f2d46] outline-none placeholder:text-[#94a3b8]"
                        />
                        <span className="text-[11px] text-[#94a3b8]">
                          {formDiscountType === "PERCENT" ? "%" : formDiscountType === "FLAT" ? "$" : "BOGO"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">Start Date</label>
                      <div className="relative mt-2">
                        <input
                          ref={startDateInputRef}
                          type="date"
                          value={formStartDate}
                          onChange={(event) => setFormStartDate(event.target.value)}
                          className="pointer-events-none absolute inset-0 z-10 opacity-0"
                          aria-label="Start Date"
                          tabIndex={-1}
                        />
                        <button
                          type="button"
                          onClick={() => openDatePicker(startDateInputRef)}
                          className="flex w-full items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-left"
                        >
                          <span className={formStartDate ? "text-[11px] text-[#1f2d46]" : "text-[11px] text-[#94a3b8]"}>
                            {formatDateDisplay(formStartDate)}
                          </span>
                          <FiCalendar size={12} className="text-[#94a3b8]" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#334155]">End Date</label>
                      <div className="relative mt-2">
                        <input
                          ref={endDateInputRef}
                          type="date"
                          value={formEndDate}
                          onChange={(event) => setFormEndDate(event.target.value)}
                          className="pointer-events-none absolute inset-0 z-10 opacity-0"
                          aria-label="End Date"
                          tabIndex={-1}
                        />
                        <button
                          type="button"
                          onClick={() => openDatePicker(endDateInputRef)}
                          className="flex w-full items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2 text-left"
                        >
                          <span className={formEndDate ? "text-[11px] text-[#1f2d46]" : "text-[11px] text-[#94a3b8]"}>
                            {formatDateDisplay(formEndDate)}
                          </span>
                          <FiCalendar size={12} className="text-[#94a3b8]" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div data-offer-apply>
                    <label className="text-[11px] font-semibold text-[#334155]">Apply To</label>
                    <button
                      type="button"
                      onClick={() => setApplyMenuOpen((current) => !current)}
                      className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-2"
                    >
                      <span className="text-[11px] text-[#1f2d46]">{formApplyTo}</span>
                      <FiChevronDown size={12} className="text-[#94a3b8]" />
                    </button>
                    {applyMenuOpen && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-[#e6ecf7] bg-white shadow-sm">
                        {["All Vendors", "Selected Vendors", "Platform Wide"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setFormApplyTo(option);
                              setApplyMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[#f8fafc] ${
                              formApplyTo === option ? "text-[#1f3d8f]" : "text-[#475569]"
                            }`}
                          >
                            {option}
                            {formApplyTo === option && <span className="text-[10px]">Active</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#e6ecf7] bg-[#f8fafc] px-3 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="m-0 text-[11px] font-semibold text-[#1f2d46]">Active Status</p>
                        <p className="m-0 mt-1 text-[10px] text-[#94a3b8]">
                          Enable this offer immediately upon creation
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormActive((current) => !current)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                          formActive ? "bg-[#1f3d8f]" : "bg-[#cbd5f5]"
                        }`}
                        aria-pressed={formActive}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            formActive ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateOpen(false);
                        resetCreateForm();
                      }}
                      className="flex-1 rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f2d46]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formName.trim() || createSaving}
                      className="flex-[1.2] rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white shadow-md shadow-[#1f3d8f]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {createSaving ? "Saving..." : editOfferId ? "Update Offer" : "Create Offer"}
                    </button>
                  </div>
                </form>
              </aside>
            </>,
            document.body
          )}
        {detailsOpen && detailsOffer &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40 bg-[#0f172a]/30"
                onClick={() => setDetailsOpen(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                <div
                  className="w-full max-w-[920px] overflow-y-auto rounded-3xl border border-[#e6ecf7] bg-[#f8fafc] shadow-2xl"
                  data-offer-details
                >
                  <header className="border-b border-[#e6ecf7] bg-white px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="m-0 text-[10px] text-[#94a3b8]">
                          Offers / {detailsOffer.name}
                        </p>
                        <h3 className="m-0 mt-1 text-[18px] font-semibold text-[#1d2a43]">
                          Offer Details
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditOffer(detailsOffer)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#1f3d8f] px-3 py-1.5 text-[10px] font-semibold text-white"
                        >
                          <FiEdit2 size={12} />
                          Edit Offer
                        </button>
                      <button
                        type="button"
                        onClick={() => setPauseConfirmOffer(detailsOffer)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#e6ecf7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1f3d8f]"
                      >
                        <FiPauseCircle size={12} />
                        {detailsOffer.status === "Active" ? "Pause" : "Resume"}
                        </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOffer(detailsOffer)}
                        className="inline-flex items-center justify-center rounded-full border border-[#fee2e2] bg-[#fef2f2] px-3 py-1.5 text-[10px] font-semibold text-[#ef4444]"
                        aria-label="Delete offer"
                      >
                        <FiTrash2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailsOpen(false)}
                          className="text-[#94a3b8]"
                          aria-label="Close offer details"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  </header>
                  <div className="space-y-4 px-6 py-5">
                    <section className="flex gap-4 rounded-2xl border border-[#e6ecf7] bg-white p-4">
                      <div className="grid h-16 w-20 place-items-center rounded-xl bg-[#f1f5f9] text-[18px] font-semibold text-[#1f3d8f]">
                        {detailsOffer.discount.replace(" OFF", "")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">
                            {detailsOffer.name}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                              detailsOffer.status === "Active"
                                ? "bg-[#dcfce7] text-[#15803d]"
                                : "bg-[#e2e8f0] text-[#64748b]"
                            }`}
                          >
                            {detailsOffer.status}
                          </span>
                        </div>
                        <p className="m-0 mt-1 text-[11px] text-[#64748b]">
                          {detailsOffer.validity}
                        </p>
                        <p className="m-0 mt-1 text-[10px] text-[#94a3b8]">
                          Applied to: {detailsOffer.appliedTo}
                        </p>
                      </div>
                    </section>

                    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {[
                        { label: "Providers", value: detailsOffer.providerCount.toLocaleString(), note: detailsOffer.appliedTo, icon: <FiUsers size={14} /> },
                        { label: "Redemptions", value: detailsOffer.redemptions.toLocaleString(), note: detailsOffer.status, icon: <FiRepeat size={14} /> },
                        { label: "Engaged Users", value: detailsOffer.engagedUsers.toLocaleString(), note: "Tracked users", icon: <FiUserCheck size={14} /> }
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-[#e6ecf7] bg-white p-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="m-0 text-[10px] text-[#8b96ad]">{item.label}</p>
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#eef2ff] text-[#1f3d8f]">
                              {item.icon}
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-[16px] font-semibold text-[#1f2d46]">
                              {item.value}
                            </span>
                            <span className="text-[9px] text-[#16a34a]">{item.note}</span>
                          </div>
                        </div>
                      ))}
                    </section>

                    <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="m-0 text-[12px] font-semibold text-[#1f2d46]">
                          Applied Providers
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
                          <div className="relative" data-offer-provider>
                            <button
                              type="button"
                              onClick={() => setProviderMenuOpen((current) => !current)}
                              className="rounded-full border border-[#e6ecf7] bg-[#f8fafc] px-2 py-1"
                            >
                              {providerCategory}
                            </button>
                            {providerMenuOpen && (
                              <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-[#e6ecf7] bg-white text-[10px] shadow-lg">
                                {providerCategoryOptions.map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                      setProviderCategory(option);
                                      setProviderMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[#f8fafc] ${
                                      providerCategory === option ? "text-[#1f3d8f]" : "text-[#475569]"
                                    }`}
                                  >
                                    {option}
                                    {providerCategory === option && <span className="text-[9px]">Active</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={providerSearch}
                            onChange={(event) => setProviderSearch(event.target.value)}
                            placeholder="Search providers..."
                            className="rounded-full border border-[#e6ecf7] bg-[#f8fafc] px-2 py-1 text-[10px] text-[#475569] outline-none placeholder:text-[#94a3b8]"
                          />
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-[#edf1fa]">
                        {providerRows.length > 0 && (
                          <div className="grid grid-cols-[minmax(0,1.6fr)_0.9fr_0.8fr_0.7fr] gap-2 border-b border-[#edf1fa] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                            <span>Provider</span>
                            <span className="text-right">Bookings</span>
                            <span className="text-right">Users</span>
                            <span className="text-right">Status</span>
                          </div>
                        )}
                        {providerRows
                          .filter((row) => {
                            const matchesCategory =
                              providerCategory === "All Categories" ||
                              row.vendorCategory === providerCategory;
                            const normalizedSearch = providerSearch.trim().toLowerCase();
                            const matchesSearch =
                              !normalizedSearch ||
                              row.providerName.toLowerCase().includes(normalizedSearch) ||
                              row.vendorCategory.toLowerCase().includes(normalizedSearch);
                            return matchesCategory && matchesSearch;
                          })
                          .map((row) => (
                            <div
                              key={row.providerId || row.providerName}
                              className="grid grid-cols-[minmax(0,1.6fr)_0.9fr_0.8fr_0.7fr] items-center gap-2 border-b border-[#edf1fa] px-3 py-2 text-[10px] text-[#64748b] last:border-b-0"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-[10px] font-semibold text-[#1f2d46]">
                                  {row.providerName}
                                </div>
                                <div className="truncate text-[9px] text-[#94a3b8]">
                                  {row.vendorCategory}
                                </div>
                              </div>
                              <span className="text-right">{row.redemptions.toLocaleString()}</span>
                              <span className="text-right">{row.engagedUsers.toLocaleString()}</span>
                              <div className="flex justify-end">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                    row.active
                                      ? "bg-[#dcfce7] text-[#15803d]"
                                      : "bg-[#e2e8f0] text-[#64748b]"
                                  }`}
                                >
                                  {row.active ? "Active" : row.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        {providerRows.length === 0 && (
                          <div className="px-3 py-4 text-[10px] text-[#94a3b8]">
                            No provider-level breakdown is available for this offer yet.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        {deleteConfirmOffer &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-50 bg-[#0f172a]/40"
                onClick={() => setDeleteConfirmOffer(null)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div
                  className="w-full max-w-[420px] rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-2xl"
                  data-offer-delete
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">
                        Delete Offer
                      </h4>
                      <p className="m-0 mt-2 text-[11px] text-[#64748b]">
                        Are you sure you want to delete "{deleteConfirmOffer.name}"? This action
                        cannot be undone.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOffer(null)}
                      className="text-[#94a3b8]"
                      aria-label="Close delete dialog"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOffer(null)}
                      className="rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f2d46]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(deleteConfirmOffer)}
                      className="rounded-full bg-[#ef4444] px-4 py-2 text-[11px] font-semibold text-white shadow-md shadow-[#ef4444]/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        {pauseConfirmOffer &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-50 bg-[#0f172a]/40"
                onClick={() => setPauseConfirmOffer(null)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div
                  className="w-full max-w-[420px] rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-2xl"
                  data-offer-pause
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="m-0 text-[14px] font-semibold text-[#1f2d46]">
                        {pauseConfirmOffer.status === "Active" ? "Pause Offer" : "Resume Offer"}
                      </h4>
                      <p className="m-0 mt-2 text-[11px] text-[#64748b]">
                        {pauseConfirmOffer.status === "Active"
                          ? `Pause "${pauseConfirmOffer.name}"? Users won't be able to redeem it.`
                          : `Resume "${pauseConfirmOffer.name}" and make it active again?`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPauseConfirmOffer(null)}
                      className="text-[#94a3b8]"
                      aria-label="Close pause dialog"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPauseConfirmOffer(null)}
                      className="rounded-full border border-[#e6ecf7] bg-white px-4 py-2 text-[11px] font-semibold text-[#1f2d46]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleStatus(pauseConfirmOffer);
                        setPauseConfirmOffer(null);
                      }}
                      className="rounded-full bg-[#1f3d8f] px-4 py-2 text-[11px] font-semibold text-white shadow-md shadow-[#1f3d8f]/20"
                    >
                      {pauseConfirmOffer.status === "Active" ? "Pause" : "Resume"}
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>
            Showing {filteredOffers.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredOffers.length)} of {filteredOffers.length} offers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className={`grid h-7 w-7 place-items-center rounded-full border border-[#e6ecf7] text-[11px] ${
                page === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === 1}
            >
              <FiChevronLeft />
            </button>
            {paginationItems.map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-[#a1aac0]">
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`grid h-7 w-7 place-items-center rounded-full text-[11px] ${
                    item === page ? "bg-[#1f3d8f] text-white" : "text-[#64748b]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className={`grid h-7 w-7 place-items-center rounded-full border border-[#e6ecf7] text-[11px] ${
                page === totalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
