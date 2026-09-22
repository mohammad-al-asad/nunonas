"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { GoGift, GoPeople } from "react-icons/go";
import { LiaHeadsetSolid } from "react-icons/lia";
import { LuLayoutDashboard } from "react-icons/lu";
import { TbBuildingStore, TbNotebook } from "react-icons/tb";
import { FiCreditCard, FiLogOut, FiSettings } from "react-icons/fi";

type RouteNavItem = {
  type: "route";
  href: string;
  label: string;
  icon: ReactNode;
};

type PanelNavItem = {
  type: "panel";
  panel: "notifications" | "profile";
  label: string;
  icon: ReactNode;
};

type NavItem = RouteNavItem | PanelNavItem;

const navItems: NavItem[] = [
  { type: "route", href: "/dashboard", label: "Dashboard", icon: <LuLayoutDashboard /> },
  { type: "route", href: "/users", label: "Users", icon: <GoPeople /> },
  { type: "route", href: "/vendors", label: "Vendors", icon: <TbBuildingStore /> },
  { type: "route", href: "/content-moderation", label: "Content Moderation", icon: <TbNotebook /> },
  { type: "route", href: "/offers", label: "Offers", icon: <GoGift /> },
  { type: "route", href: "/billing", label: "Billing", icon: <FiCreditCard /> },
  { type: "route", href: "/support", label: "Support", icon: <LiaHeadsetSolid /> },
  { type: "route", href: "/settings", label: "Settings", icon: <FiSettings /> }
];

export function Sidebar({
  activePanel,
  onOpenPanel
}: {
  activePanel: "notifications" | "profile" | null;
  onOpenPanel: (panel: "notifications" | "profile") => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen self-start flex-col overflow-hidden border-r border-white/10 bg-[var(--bg-sidebar)] text-[#f7f9ff] max-[980px]:static max-[980px]:h-auto">
      <Link href="/"  className="border-b border-white/10 px-[22px] py-[20px] text-[30px] font-bold">
        Logo
      </Link>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-[10px] py-[14px]">
        {navItems.map((item) => {
          if (item.type === "panel") {
            const isActive = activePanel === item.panel;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onOpenPanel(item.panel)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#e9efff] transition-colors hover:bg-white/15 ${
                  isActive ? "bg-[var(--bg-sidebar-accent)] text-[#0f2b55] font-semibold" : ""
                }`}
              >
                <span className="flex h-[22px] w-[22px] items-center justify-center text-[22px] leading-none">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          }

          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#e9efff] transition-colors hover:bg-white/15 ${
                isActive ? "bg-[var(--bg-sidebar-accent)] text-[#0f2b55] font-semibold" : ""
              }`}
            >
              <span className="flex h-[22px] w-[22px] items-center justify-center text-[22px] leading-none">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-[10px] py-[14px]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#e9efff] transition-colors hover:bg-white/15"
        >
          <span className="flex h-[22px] w-[22px] items-center justify-center text-[22px] leading-none">
            <FiLogOut />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
