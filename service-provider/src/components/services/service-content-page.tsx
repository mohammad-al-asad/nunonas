"use client";

import { Info } from "lucide-react";
import { Header } from "@/components/Header";
import { GalleryManager } from "@/components/services/gallery-manager";
import { MenuItemsManager, type MenuServiceType } from "@/components/services/menu-items";

const PAGE_COPY: Record<MenuServiceType, { header: string; title: string; text: string }> = {
  restaurant: {
    header: "Restaurant / Services",
    title: "Your Menu and Photos",
    text: "Add menu items with a name, description, price and photo, and upload gallery photos of your restaurant. Customers see both in the app.",
  },
  spa: {
    header: "Spa / Services",
    title: "Your Treatments and Photos",
    text: "Add treatments with a name, description, price and photo, and upload gallery photos of your spa. Customers see both in the app and pick a treatment when booking.",
  },
};

/** Restaurant and spa "Services" pages: menu items or treatments, then the gallery. */
export function ServiceContentPage({ serviceType }: { serviceType: MenuServiceType }) {
  const copy = PAGE_COPY[serviceType];
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header title={copy.header} />

      <main className="flex-1 px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <section className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#3b82f6]">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">{copy.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{copy.text}</p>
              </div>
            </div>
          </section>

          <MenuItemsManager serviceType={serviceType} />
          <GalleryManager serviceType={serviceType} />
        </div>
      </main>
    </div>
  );
}
