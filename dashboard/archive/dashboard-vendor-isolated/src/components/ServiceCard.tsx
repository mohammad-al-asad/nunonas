"use client";

import React from "react";
import {
  Coffee,
  WashingMachine,
  Sparkles,
  Utensils,
  Waves,
  MoreVertical,
  Clock,
} from "lucide-react";
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
}

const CATEGORY_ICONS = {
  Food: Utensils,
  Laundry: WashingMachine,
  Cleaning: Sparkles,
  Wellness: Waves,
  Other: Coffee,
};

export function ServiceCard({ service, onToggleStatus }: ServiceCardProps) {
  const Icon = CATEGORY_ICONS[service.category] || CATEGORY_ICONS.Other;

  return (
    <div className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
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
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-[#1e2a5e] hover:text-white transition-all">
            <MoreVertical className="h-5 w-5" />
          </button>
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

          <button className="h-12 px-6 bg-[#1e2a5e] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#1a234d] transition-all shadow-lg shadow-[#1e2a5e]/20 active:scale-95">
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}
