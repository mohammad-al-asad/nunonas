"use client";

import React, { useEffect, useState } from "react";
import {
  BedDouble,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { RoomCard, Room } from "@/components/RoomCard";
import { ServiceCard, ServiceItem } from "@/components/ServiceCard";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  vendorDeleteRoom,
  vendorDeleteService,
  vendorListRooms,
  vendorListServices,
  vendorUpdateRoomAvailability,
  vendorUpdateServiceStatus,
} from "@/lib/vendor-api";

export default function HotelServicesPage() {
  const [activeTab, setActiveTab] = useState<"rooms" | "services">("rooms");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "room" | "service";
  } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadData = async () => {
    try {
      const [roomsRes, servicesRes] = await Promise.all([
        vendorListRooms(),
        vendorListServices("hotel"),
      ]);

      const mappedRooms = (roomsRes.items || []).map((room: Record<string, unknown>) => ({
        id: String(room.id ?? ""),
        name: String(room.name ?? "Room"),
        image:
          String((room.images as string[] | undefined)?.[0] ?? ""),
        price: Number(room.base_price ?? 0),
        size: Number(room.size_sqm ?? 0),
        maxGuests: Number(room.max_guests ?? 1),
        bedType: String(room.bed_type ?? "Bed"),
        amenities: Array.isArray(room.amenities)
          ? room.amenities.map((item) => String(item))
          : [],
        status: (room.available ?? room.active_status ?? true)
          ? "Available"
          : "Unavailable",
      })) as Room[];

      const mappedServices = (servicesRes.items || []).map((service: Record<string, unknown>) => ({
        id: String(service.id ?? ""),
        name: String(service.name ?? "Service"),
        category: String(service.category ?? "Other") as ServiceItem["category"],
        price: Number(service.price ?? 0),
        image:
          String((service.images as string[] | undefined)?.[0] ?? ""),
        available: Boolean(service.available ?? service.active_status ?? true),
        deliveryTime: String(service.delivery_time ?? "UPON REQUEST"),
      })) as ServiceItem[];

      setRooms(mappedRooms);
      setServices(mappedServices);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to load hotel inventory.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const toggleRoomStatus = async (id: string) => {
    const room = rooms.find((item) => item.id === id);
    if (!room) {
      return;
    }

    const nextAvailable = room.status !== "Available";
    try {
      await vendorUpdateRoomAvailability(id, nextAvailable);
      setRooms((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: nextAvailable ? "Available" : "Unavailable" }
            : item,
        ),
      );
      setStatusMessage("Room availability updated.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to update room status.",
      );
    }
  };

  const toggleServiceStatus = async (id: string) => {
    const service = services.find((item) => item.id === id);
    if (!service) {
      return;
    }

    const nextAvailable = !service.available;
    try {
      await vendorUpdateServiceStatus(id, nextAvailable);
      setServices((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, available: nextAvailable } : item,
        ),
      );
      setStatusMessage("Service availability updated.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to update service status.",
      );
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await vendorDeleteRoom(id);
      setRooms((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage("Room deleted.");
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to delete room.");
      return false;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await vendorDeleteService(id);
      setServices((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage("Service deleted.");
      return true;
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to delete service.",
      );
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const deleted = deleteTarget.type === "room"
        ? await deleteRoom(deleteTarget.id)
        : await deleteService(deleteTarget.id);
      if (deleted) setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    `${room.name} ${room.bedType} ${room.amenities.join(" ")}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const filteredServices = services.filter((service) =>
    `${service.name} ${service.category} ${service.deliveryTime ?? ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const summaryItems = [
    {
      label: "Room Types",
      value: rooms.length,
      icon: BedDouble,
    },
    {
      label: "Active Services",
      value: services.filter((item) => item.available).length,
      icon: Sparkles,
    },
    {
      label: "Total Listings",
      value: rooms.length + services.length,
      icon: Filter,
    },
  ];

  const visibleItems = activeTab === "rooms" ? filteredRooms : filteredServices;

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        {statusMessage ? (
          <p className="text-sm font-bold text-[#1e2a5e]">{statusMessage}</p>
        ) : null}

        <div className="flex justify-end">
          <Link
            href={activeTab === "rooms" ? "/hotel-services/add" : "/hotel-services/add-service"}
            className="group flex items-center justify-center gap-3 rounded-[24px] bg-[#1e2a5e] px-8 py-5 text-sm font-black text-white shadow-xl shadow-[#1e2a5e]/20 transition-all hover:bg-[#1a234d]"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            {activeTab === "rooms" ? "Add New Room" : "Add Room Service"}
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </span>
                <item.icon className="h-5 w-5 text-[#1e2a5e]" />
              </div>
              <p className="mt-4 text-4xl font-black tracking-tight text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <div className="flex w-fit rounded-[32px] border border-slate-100 bg-white/50 p-2">
          <button
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "rounded-[24px] px-8 py-4 text-xs font-black uppercase tracking-widest transition-all",
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
              "rounded-[24px] px-8 py-4 text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "services"
                ? "bg-[#1e2a5e] text-white shadow-xl shadow-[#1e2a5e]/20"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            Room Services
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="group relative flex-1">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#1e2a5e]" />
            <input
              type="text"
              placeholder={
                activeTab === "rooms"
                  ? "Search room type, bed type, amenities..."
                  : "Search services, categories, delivery time..."
              }
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-[28px] border border-slate-100 bg-white py-5 pl-16 pr-6 text-sm font-bold text-slate-700 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-sky-50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[32px] border border-slate-100 bg-white text-sm font-bold text-slate-400 shadow-sm">
            Loading inventory...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white text-center shadow-sm">
            <Trash2 className="h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-slate-700">
              {activeTab === "rooms" ? "No room listings yet" : "No service listings yet"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              {activeTab === "rooms"
                ? "Create your room inventory with pricing, amenities, and availability controls."
                : "Add guest-facing services so your hotel team can manage them from one place."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2 lg:grid-cols-3">
                {activeTab === "rooms"
              ? filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onToggleStatus={toggleRoomStatus}
                    onDelete={(id) => setDeleteTarget({ id, name: room.name, type: "room" })}
                    editHref={`/hotel-services/rooms/${room.id}`}
                  />
                ))
              : filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onToggleStatus={toggleServiceStatus}
                    onDelete={(id) => setDeleteTarget({ id, name: service.name, type: "service" })}
                    editHref={`/hotel-services/services/${service.id}`}
                  />
                ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete this ${deleteTarget?.type ?? "listing"}?`}
        message={`"${deleteTarget?.name ?? "This listing"}" will be permanently removed.`}
        confirmLabel={`Delete ${deleteTarget?.type ?? "listing"}`}
        destructive
        busy={deleteBusy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
