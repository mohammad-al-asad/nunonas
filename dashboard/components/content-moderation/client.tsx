"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {  FiCheck, FiClock, FiEye, FiX } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { IoBarChart } from "react-icons/io5";
import { IoMdCloseCircle } from "react-icons/io";

type QueueType = "PHOTO" | "MENU" | "INFO";
type ApprovalState = "pending" | "approved" | "rejected";

type ModerationItem = {
  id: string;
  title: string;
  age: string;
  subtitle: string;
  venue: string;
  location: string;
  vendorId: string;
  queueType: QueueType;
  previewImage: string;
  state: ApprovalState;
};

function queueClass(type: QueueType) {
  if (type === "MENU") return "bg-[#eef2ff] text-[#1f3d8f]";
  if (type === "INFO") return "bg-[#eef2ff] text-[#1f3d8f]";
  return "bg-[#eef2ff] text-[#1f3d8f]";
}

export function ContentManagementView({ data }: { data: { totalSubmissions: number; items: ModerationItem[] } }) {
  const [items, setItems] = useState<ModerationItem[]>(data.items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  const summaryCards = useMemo(() => {
    const pending = items.filter((item) => item.state === "pending").length;
    const approved = items.filter((item) => item.state === "approved").length;
    const rejected = items.filter((item) => item.state === "rejected").length;
    return [
      { label: "TOTAL SUBMISSIONS", value: data.totalSubmissions.toLocaleString(), tone: "text-[#1f3d8f]" },
      { label: "PENDING REVIEW", value: pending.toLocaleString(), tone: "text-[#1f3d8f]" },
      { label: "APPROVED TODAY", value: approved.toLocaleString(), tone: "text-[#16a34a]" },
      { label: "REJECTED TODAY", value: rejected.toLocaleString(), tone: "text-[#e11d48]" }
    ];
  }, [items, data.totalSubmissions]);

  const updateItemState = async (id: string, nextState: ApprovalState) => {
    try {
      const res = await fetch(`/api/content-moderation/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextState })
      });
      if (!res.ok) return;
      const payload = (await res.json()) as { item?: ModerationItem };
      if (!payload.item) return;
      setItems((prev) => prev.map((item) => (item.id === payload.item?.id ? payload.item : item)));
    } catch {
      // no-op for mock API
    }
  };

  return (
    <section className="relative space-y-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <article key={card.label} className="rounded-xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="m-0 text-[10px] tracking-[0.08em] text-[#7d8ba6]">{card.label}</p>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef2ff] text-[#1f3d8f]">
                {index === 0 && <IoBarChart  size={18}  />}
                {index === 1 && <FiClock size={18} />}
                {index === 2 && <FaCheckCircle  size={18} color="green"/>}
                {index === 3 && <IoMdCloseCircle size={18} color="red"/>}
              </div>
            </div>
            <h3 className={`m-0 text-[26px] leading-none ${card.tone}`}>{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const isSelected = item.id === selectedItemId;
          return (
            <article
              key={item.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                isSelected ? "border-[#1f3d8f] shadow-[0_8px_20px_rgba(31,61,143,0.15)]" : "border-[#e6ecf7]"
              }`}
            >
              <div className="relative h-[120px] w-full bg-[#f3f5f9]">
                <Image src={item.previewImage} alt={item.title} fill className="object-cover" />
                <span className={`absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold ${queueClass(item.queueType)}`}>
                  {item.queueType}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="m-0 text-[12px] font-semibold text-[#1d2a43]">{item.title}</h4>
                  <span className="text-[9px] text-[#95a2b8]">{item.age}</span>
                </div>
                <p className="m-0 text-[10px] text-[#8b96ad]">{item.subtitle}</p>
                <div className="flex items-center justify-between border-t border-[#edf1fa] pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full bg-[#ecfdf3] text-[#16a34a]"
                      onClick={() => updateItemState(item.id, "approved")}
                      aria-label={`Approve ${item.title}`}
                    >
                      <FiCheck size={12} />
                    </button>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full bg-[#fef2f2] text-[#ef4444]"
                      onClick={() => updateItemState(item.id, "rejected")}
                      aria-label={`Reject ${item.title}`}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1f3d8f]"
                  >
                    <FiEye size={12} />
                    DETAILS
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <div
        className={`fixed inset-0 z-20 bg-black/40 transition-opacity ${
          selectedItem ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSelectedItemId(null)}
        aria-hidden
      />

      {selectedItem && (
        <div className="fixed inset-0 z-30 grid place-items-center px-4">
          <aside className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
            <header className="flex items-start justify-between border-b border-[#eef2f9] px-5 py-4">
              <div>
                <h4 className="m-0 text-[14px] font-semibold text-[#1d2a43]">Review Details</h4>
                <p className="m-0 mt-1 text-[10px] text-[#8b96ad]">Submission #ID-{selectedItem.id.replace("#", "")}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemId(null)}
                className="grid h-7 w-7 place-items-center rounded-full border border-[#e6ecf7] text-[#8b96ad]"
              >
                <FiX size={14} />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <div className="relative h-[200px] overflow-hidden rounded-xl bg-[#dfe7f5]">
                <Image src={selectedItem.previewImage} alt={selectedItem.title} fill className="object-cover" />
              </div>

              <section>
                <h5 className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad] uppercase">Business Info</h5>
                <div className="mt-2 rounded-xl bg-[#f4f6fb] px-4 py-3">
                  <h6 className="m-0 text-[14px] font-semibold text-[#1f3d8f]">{selectedItem.venue}</h6>
                  <p className="m-0 text-[10px] text-[#7184a4]">{selectedItem.location}</p>
                  <p className="m-0 text-[10px] text-[#7184a4]">Vendor ID: {selectedItem.vendorId}</p>
                </div>
              </section>
            </div>

            <div className="flex items-center gap-3 border-t border-[#eef2f9] px-5 py-4">
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#fde1e1] bg-[#fff5f5] text-[12px] font-semibold text-[#ef4444]"
                onClick={() => updateItemState(selectedItem.id, "rejected")}
              >
                <FiX size={14} />
                Reject
              </button>
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1f3d8f] text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(31,61,143,0.25)]"
                onClick={() => updateItemState(selectedItem.id, "approved")}
              >
                <FiCheck size={14} />
                Approve
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

