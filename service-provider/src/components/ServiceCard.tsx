"use client";

import React from "react";
import {
  Coffee,
  WashingMachine,
  Sparkles,
  Utensils,
  Waves,
  Clock,
  ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ServiceItem {
  id: string;
  name: string;
  category: "Food" | "Laundry" | "Cleaning" | "Wellness" | "Other";
  price: number;
  image: string;
  available: boolean;
  deliveryTime?: string;
}

interface ServiceCardProps {
  service: ServiceItem;
  onToggleStatus: (id: string) => void;
  onDelete?: (id: string) => void;
  editHref?: string;
}

const CATEGORY_ICONS = {
  Food: Utensils,
  Laundry: WashingMachine,
  Cleaning: Sparkles,
  Wellness: Waves,
  Other: Coffee,
};

export function ServiceCard({
  service,
  onToggleStatus,
  onDelete,
  editHref,
}: ServiceCardProps) {
  const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.Other;

  return (
    <div className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
            <ImageIcon className="h-9 w-9" />
            <span className="mt-2 text-xs font-bold">No service image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Category Badge */}
        <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl flex items-center gap-2 shadow-lg">
          <Icon className="h-3.5 w-3.5 text-[#1e2a5e]" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            {service.category}
          </span>
        </div>

        {/* Status Toggle in Overly */}
        <button
          onClick={() => onToggleStatus(service.id)}
          className={cn(
            "absolute top-6 right-6 h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider backdrop-blur-md transition-all active:scale-95",
            service.available
              ? "bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/30"
              : "bg-rose-500/90 text-white shadow-lg shadow-rose-500/30",
          )}
        >
          {service.available ? "Active" : "Inactive"}
        </button>
      </div>

      {/* Content */}
      <div className="p-8 space-y-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-[#1e2a5e] transition-colors leading-tight">
              {service.name}
            </h3>
            {service.deliveryTime && (
              <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {service.deliveryTime}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {editHref ? (
              <Link
                href={editHref}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-[#1e2a5e] hover:text-white"
                aria-label={`Edit ${service.name}`}
              >
                <Pencil className="h-5 w-5" />
              </Link>
            ) : null}
            {onDelete ? (
              <button
                onClick={() => onDelete(service.id)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-100"
                aria-label={`Delete ${service.name}`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-50 flex items-end justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] block mb-1">
              Starting from
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#1e2a5e] tracking-tighter">
                ${service.price}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                / Unit
              </span>
            </div>
          </div>

          {editHref ? (
            <Link
              href={editHref}
              className="flex h-12 items-center rounded-2xl bg-[#1e2a5e] px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#1e2a5e]/20 transition-all hover:bg-[#1a234d] active:scale-95"
            >
              Edit Details
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
