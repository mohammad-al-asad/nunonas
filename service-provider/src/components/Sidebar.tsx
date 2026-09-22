"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgePercent,
  CalendarPlus2,
  ChevronDown,
  ChevronRight,
  Hotel,
  LogOut,
  UtensilsCrossed,
  Waves,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSidebarItemsForCategories,
  type VendorCategory,
} from "@/lib/vendor-access";
import { clearVendorTokens } from "@/lib/vendor-api";
import { useAppDispatch } from "@/store/hooks";
import { closePortalOverlays } from "@/store/slices/portal-ui-slice";
import { resetProviderState } from "@/store/slices/provider-slice";

export function Sidebar({
  categories,
  mobileOpen = false,
  onMobileClose,
}: {
  categories: VendorCategory[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navItems = getSidebarItemsForCategories(categories);
  const directGroups = [
    { label: "Overview", hrefs: ["/dashboard", "/analytics"] },
    { label: "Operations", hrefs: ["/operations", "/customers"] },
    { label: "Engagement", hrefs: ["/promotions", "/loyalty", "/reviews"] },
    { label: "Account", hrefs: ["/settings", "/profile", "/notifications"] },
  ];
  const groupedItems = directGroups.map((group) => ({
    ...group,
    items: group.hrefs.map((href) => navItems.find((item) => item.href === href)).filter((item): item is typeof navItems[number] => Boolean(item)),
  })).filter((group) => group.items.length > 0);
  const serviceGroups = [
    {
      key: "event",
      name: "Event",
      icon: CalendarPlus2,
      enabled: categories.includes("Event"),
      links: [
        { href: "/events", label: "Event Management" },
        { href: "/event-bookings", label: "Event Bookings" },
      ],
    },
    {
      key: "happy-hour",
      name: "Happy Hour",
      icon: BadgePercent,
      // Happy Hour is a universal provider feature, not an onboarding business module.
      enabled: true,
      links: [
        { href: "/happy-hours", label: "Happy Hour Management" },
      ],
    },
    {
      key: "restaurant",
      name: "Restaurant",
      icon: UtensilsCrossed,
      enabled: categories.includes("Restaurant"),
      links: [
        { href: "/restaurant-bookings", label: "Booking Management" },
        { href: "/services", label: "Service Management" },
      ],
    },
    {
      key: "hotel",
      name: "Hotel",
      icon: Hotel,
      enabled: categories.includes("Hotel"),
      links: [
        { href: "/hotel-bookings", label: "Booking Management" },
        { href: "/hotel-services", label: "Room & Service Management" },
      ],
    },
    {
      key: "spa",
      name: "Spa",
      icon: Waves,
      enabled: categories.includes("Spa"),
      links: [
        { href: "/spa-bookings", label: "Booking Management" },
        { href: "/spa-services", label: "Service Management" },
      ],
    },
  ]
    .filter((group) => group.enabled)
    .map((group) => ({
      ...group,
      links: group.links
        .map((link) => ({
          ...link,
          item: navItems.find((item) => item.href === link.href),
        }))
        .filter((link): link is typeof link & { item: NonNullable<typeof link.item> } => Boolean(link.item)),
    }))
    .filter((group) => group.links.length > 0);
  const activeServiceKey =
    serviceGroups.find((group) =>
      group.links.some(
        ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
      ),
    )?.key ?? null;
  const [serviceMenuState, setServiceMenuState] = React.useState<{
    pathname: string;
    expanded: string | null;
  }>({ pathname, expanded: activeServiceKey });
  const expandedService =
    serviceMenuState.pathname === pathname
      ? serviceMenuState.expanded
      : activeServiceKey;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearVendorTokens();
      queryClient.clear();
      dispatch(resetProviderState());
      dispatch(closePortalOverlays());
      router.replace("/auth/login");
    }
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-white/5 bg-[#1e2a5e] text-white shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5 md:h-24 md:px-6">
        <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <img src="/activity-planner-logo.png" alt="Activity Planner" className="h-10 w-10 rounded-xl object-cover" />
          <span><span className="block text-lg font-black tracking-tight">Activity Planner</span><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Provider portal</span></span>
        </Link>
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-4" aria-label="Portal sections">
        {groupedItems.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400/80">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onMobileClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                      isActive
                        ? "bg-sky-400 text-[#12204f] shadow-lg shadow-sky-950/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                    title={item.name}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-black"
                          : "text-slate-400 group-hover:text-white",
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 transition-opacity",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60",
                      )}
                    />
                  </Link>
                );
              })}

              {group.label === "Operations"
                ? serviceGroups.map((serviceGroup) => {
                    const isExpanded = expandedService === serviceGroup.key;
                    const isActive = activeServiceKey === serviceGroup.key;
                    const menuId = `sidebar-${serviceGroup.key}-menu`;
                    return (
                      <div key={serviceGroup.key}>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={menuId}
                          onClick={() =>
                            setServiceMenuState({
                              pathname,
                              expanded: isExpanded
                                ? null
                                : serviceGroup.key,
                            })
                          }
                          className={cn(
                            "group flex min-h-11 w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                            isActive
                              ? "bg-white/15 text-white"
                              : "text-slate-300 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          <serviceGroup.icon
                            className={cn(
                              "mr-3 h-5 w-5 shrink-0",
                              isActive
                                ? "text-sky-300"
                                : "text-slate-400 group-hover:text-white",
                            )}
                          />
                          <span className="truncate">
                            {serviceGroup.name}
                          </span>
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform duration-200",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </button>

                        {isExpanded ? (
                          <div
                            id={menuId}
                            className="ml-5 mt-1 space-y-1 border-l border-white/15 pl-3"
                          >
                            {serviceGroup.links.map(({ href, label, item }) => {
                              const childActive =
                                pathname === href ||
                                pathname.startsWith(`${href}/`);
                              return (
                                <Link
                                  key={href}
                                  href={href}
                                  onClick={onMobileClose}
                                  aria-current={
                                    childActive ? "page" : undefined
                                  }
                                  className={cn(
                                    "group flex min-h-10 items-center rounded-xl px-3 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                                    childActive
                                      ? "bg-sky-400 text-[#12204f] shadow-md shadow-sky-950/20"
                                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                                  )}
                                  title={`${serviceGroup.name} ${label}`}
                                >
                                  <item.icon
                                    className={cn(
                                      "mr-2.5 h-4 w-4 shrink-0",
                                      childActive
                                        ? "text-[#12204f]"
                                        : "text-slate-400 group-hover:text-white",
                                    )}
                                  />
                                  <span className="min-w-0 leading-5">
                                    {label}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 py-4 md:px-4">
        <button type="button" onClick={handleLogout} className="group flex min-h-11 w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
          <LogOut className="mr-3 h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-white" />
          <span>Logout</span>
        </button>
      </div>
      </aside>
    </>
  );
}
