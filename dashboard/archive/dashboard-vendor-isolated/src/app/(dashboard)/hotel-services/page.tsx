"use client";

import React, { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { RoomCard, Room } from "@/components/RoomCard";
import { ServiceCard, ServiceItem } from "@/components/ServiceCard";
import { cn } from "@/lib/utils";

const DUMMY_ROOMS: Room[] = [
  {
    id: "1",
    name: "Deluxe King Room",
    image:
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
    tag: "MOST POPULAR",
    price: 180,
    size: 32,
    maxGuests: 2,
    bedType: "King Bed",
    amenities: ["Wi-Fi", "Smart TV", "Balcony", "AC"],
    status: "Available",
  },
  {
    id: "2",
    name: "Executive Suite",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    price: 350,
    size: 65,
    maxGuests: 3,
    bedType: "Super King",
    amenities: ["Mini-bar", "Ocean View", "Workstation", "Bathtub"],
    status: "Available",
  },
  {
    id: "3",
    name: "Standard Double",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    price: 120,
    size: 24,
    maxGuests: 2,
    bedType: "Double Bed",
    amenities: ["Wi-Fi", "AC"],
    status: "Under Maintenance",
  },
];

const DUMMY_SERVICES: ServiceItem[] = [
  {
    id: "s1",
    name: "Gourmet Breakfast Tray",
    category: "Food",
    price: 25,
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80",
    available: true,
    deliveryTime: "30-45 MIN",
  },
  {
    id: "s2",
    name: "Express Dry Cleaning",
    category: "Laundry",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80",
    available: true,
    deliveryTime: "SAME DAY",
  },
  {
    id: "s3",
    name: "Aromatherapy Massage",
    category: "Wellness",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=400&q=80",
    available: false,
    deliveryTime: "UPON REQUEST",
  },
];

import {
  vendorListRooms,
  vendorUpdateRoomAvailability,
  vendorListServices,
  vendorUpdateServiceStatus,
} from "@/lib/vendor-api";
import { useEffect } from "react";

export default function HotelServicesPage() {
  const [activeTab, setActiveTab] = useState<"rooms" | "services">("rooms");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const roomsRes = await vendorListRooms();
        const mappedRooms = (roomsRes.items || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          image: r.images?.[0] || "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
          price: r.base_price,
          size: r.size_sqm,
          maxGuests: r.max_guests,
          bedType: r.bed_type,
          amenities: r.amenities || [],
          status: (r.available ? "Available" : "Unavailable") as "Available" | "Unavailable" | "Under Maintenance",
        }));
        setRooms(mappedRooms);

        const servicesRes = await vendorListServices();
        const mappedServices = (servicesRes.items || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          price: s.price,
          image: s.images?.[0] || "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80",
          available: s.available ?? s.active_status ?? true,
          deliveryTime: s.delivery_time || "UPON REQUEST",
        }));
        setServices(mappedServices);
      } catch (err) {
        console.error("Failed to load rooms and services:", err);
      }
    }
    void loadData();
  }, []);

  const toggleRoomStatus = async (id: string) => {
    const room = rooms.find((r) => r.id === id);
    if (!room) return;
    const nextAvailable = room.status !== "Available";
    try {
      await vendorUpdateRoomAvailability(id, nextAvailable);
      setRooms(
        rooms.map((r) =>
          r.id === id
            ? { ...r, status: nextAvailable ? "Available" : "Unavailable" }
            : r,
        ),
      );
    } catch (err) {
      alert("Failed to update room status: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const toggleServiceStatus = async (id: string) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;
    const nextAvailable = !service.available;
    try {
      await vendorUpdateServiceStatus(id, nextAvailable);
      setServices(
        services.map((s) =>
          s.id === id ? { ...s, available: nextAvailable } : s,
        ),
      );
    } catch (err) {
      alert("Failed to update service status: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen p-4 md:p-10 bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              Hotel Properties & Services
            </h1>
            <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">
              Manage your room inventory and guest amenity offerings
            </p>
          </div>
          <Link
            href={
              activeTab === "rooms"
                ? "/hotel-services/add"
                : "/hotel-services/add-service"
            }
            className="flex items-center justify-center gap-3 bg-[#1e2a5e] text-white px-8 py-5 rounded-[24px] font-black text-sm hover:bg-[#1a234d] transition-all shadow-xl shadow-[#1e2a5e]/20 group"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            {activeTab === "rooms" ? "Add New Room" : "Add Room Service"}
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/50 p-2 rounded-[32px] border border-slate-100 w-fit">
          <button
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "rooms"
                ? "bg-[#1e2a5e] text-white shadow-xl shadow-[#1e2a5e]/20"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            Rooms Inventory
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={cn(
              "px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "services"
                ? "bg-[#1e2a5e] text-white shadow-xl shadow-[#1e2a5e]/20"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            Room Services
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#1e2a5e] transition-colors" />
            <input
              type="text"
              placeholder={
                activeTab === "rooms"
                  ? "Search room type, amenities..."
                  : "Search services, categories..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[28px] text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-50 transition-all"
            />
          </div>
          <button className="flex items-center gap-3 px-8 py-5 bg-white border border-slate-100 rounded-[28px] text-sm font-black text-slate-700 hover:bg-slate-50 transition-all">
            <Filter className="h-5 w-5 text-[#1e2a5e]" />
            Filters
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {activeTab === "rooms"
            ? filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onToggleStatus={toggleRoomStatus}
                />
              ))
            : filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onToggleStatus={toggleServiceStatus}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
