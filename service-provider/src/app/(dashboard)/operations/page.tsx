"use client";

import Link from "next/link";
import { BadgePercent, CalendarPlus2, CalendarRange, Hotel, UtensilsCrossed, Waves } from "lucide-react";
import { Header } from "@/components/Header";
import { extractVendorCategories, type VendorCategory } from "@/lib/vendor-access";
import { useQuery } from "@tanstack/react-query";
import { vendorProfileQuery } from "@/lib/vendor-queries";

type Operation = {
  title: string;
  description: string;
  href: string;
  icon: typeof Hotel;
  category?: VendorCategory;
};

const SHARED_OPERATIONS: Operation[] = [];

const CATEGORY_OPERATIONS: Record<VendorCategory, Operation[]> = {
  Restaurant: [
    { title: "Restaurant bookings", description: "Review and confirm guest reservations.", href: "/restaurant-bookings", icon: UtensilsCrossed },
    { title: "Restaurant services", description: "Manage your menu, gallery, and offers.", href: "/services", icon: UtensilsCrossed },
  ],
  Hotel: [
    { title: "Hotel bookings", description: "Manage stays, payments, and booking status.", href: "/hotel-bookings", icon: CalendarRange },
    { title: "Rooms and services", description: "Update rooms, inventory, availability, and guest services.", href: "/hotel-services", icon: Hotel },
  ],
  Spa: [
    { title: "Spa bookings", description: "Manage appointments, confirmations, payments, and guest requests.", href: "/spa-bookings", icon: CalendarRange },
    { title: "Spa services", description: "Manage treatments, schedules, and service images.", href: "/spa-services", icon: Waves },
  ],
  Event: [
    { title: "Event management", description: "Create, publish, and manage your events.", href: "/events", icon: CalendarPlus2 },
    { title: "Event bookings", description: "Review ticket and event booking requests.", href: "/event-bookings", icon: CalendarRange },
  ],
  "Happy Hour": [
    { title: "Happy Hour management", description: "Publish recurring offers with their own schedule and pricing.", href: "/happy-hours", icon: BadgePercent },
  ],
};

export default function OperationsPage() {
  const profileQuery = useQuery(vendorProfileQuery());
  const categories = extractVendorCategories(profileQuery.data?.categories ?? profileQuery.data?.category);
  const operations = [...SHARED_OPERATIONS, ...categories.flatMap((category) => CATEGORY_OPERATIONS[category])];

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <Header title="Operations" />
      <main className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-label="Operations navigation" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {operations.map((operation) => {
            const Icon = operation.icon;
            return (
              <Link key={operation.href} href={operation.href} prefetch={false} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><Icon className="h-6 w-6" /></span>
                <h2 className="mt-5 text-lg font-black text-slate-800 group-hover:text-sky-600">{operation.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{operation.description}</p>
                <span className="mt-5 inline-flex text-sm font-bold text-sky-600">Open section →</span>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
