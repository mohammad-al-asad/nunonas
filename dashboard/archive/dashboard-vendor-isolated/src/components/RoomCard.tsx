"use client";

import React from "react";
import {
  Users,
  BedDouble,
  Maximize2,
  MoreHorizontal,
  Wifi,
  Wind,
  Tv,
  Wine,
  Coffee,
  ShieldCheck,
  Palmtree,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Room {
  id: string;
  name: string;
  image: string;
  tag?: string;
  price: number;
  size: number;
  maxGuests: number;
  bedType: string;
  amenities: string[];
  status: "Available" | "Unavailable" | "Under Maintenance";
}

const AMENITY_ICONS: Record<string, any> = {
  "Wi-Fi": Wifi,
  AC: Wind,
  "Smart TV": Tv,
  "Mini-bar": Wine,
  "Coffee Maker": Coffee,
  Workstation: Laptop,
  "Ocean View": Palmtree,
  Balcony: Palmtree,
  "Safe Box": ShieldCheck,
  Bathtub: BedDouble, // Fallback icon
};

interface RoomCardProps {
  room: Room;
  onToggleStatus: (id: string) => void;
}

export function RoomCard({ room, onToggleStatus }: RoomCardProps) {
  return (
    <div className="group bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
      {/* Image Section */}
      <div className="relative h-[240px]">
        <img
          src={room.image}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Top Badges */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          {room.tag && (
            <span className="bg-[#1e2a5e] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              {room.tag}
            </span>
          )}
          {room.status === "Under Maintenance" && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center rounded-[32px] m-4">
              <span className="text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/20">
                Under Maintenance
              </span>
            </div>
          )}
        </div>

        <button className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-[#1e2a5e] transition-colors line-clamp-1">
              {room.name}
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">{room.size} sqm</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#1e2a5e] block">
              ${room.price}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              per night
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-600">
              {room.maxGuests} Guests
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
              <BedDouble className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-600">
              {room.bedType}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">
            Amenities
          </span>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((amenity, idx) => (
              <span
                key={idx}
                className="bg-slate-50 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-slate-500 border border-transparent hover:border-slate-200 transition-colors"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Status & Menu */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleStatus(room.id)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                room.status === "Available" ? "bg-[#1e2a5e]" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  room.status === "Available"
                    ? "translate-x-6"
                    : "translate-x-1",
                )}
              />
            </button>
            <span
              className={cn(
                "text-xs font-black uppercase tracking-widest",
                room.status === "Available"
                  ? "text-slate-600"
                  : "text-slate-400",
              )}
            >
              {room.status === "Available" ? "Available" : "Unavailable"}
            </span>
          </div>

          <div className="flex gap-2">
            <button className="h-4 w-4 rounded-full bg-slate-100" />
            <button className="h-4 w-4 rounded-full bg-slate-100" />
            <button className="h-4 w-4 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
