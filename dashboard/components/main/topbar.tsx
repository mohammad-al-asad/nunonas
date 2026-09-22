"use client";

import { FiBell } from "react-icons/fi";
import { usePathname } from "next/navigation";

const titleByRoute: Record<string, string> = {
  "/dashboard": "Platform Overview",
  "/users": "User Management",
  "/vendors": "Service Providers Management",
  "/content-moderation": "Content Management",
  "/offers": "Offers",
  "/billing": "Billing",
  "/support": "Support",
  "/settings": ""
};

export function Topbar({
  onOpenPanel,
  adminAvatar,
  adminName
}: {
  onOpenPanel: (panel: "notifications" | "profile") => void;
  adminAvatar?: string;
  adminName?: string;
}) {
  const pathname = usePathname();
  const title = pathname.startsWith("/settings")
    ? ""
    : (titleByRoute[pathname] ?? "Platform Overview");

  const initials = adminName
    ? adminName
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <header className="topbar">
      {title ? <h1 className="title">{title}</h1> : <div aria-hidden />}
      <div className="topbar-right">
        <button
          type="button"
          onClick={() => onOpenPanel("notifications")}
          className="group relative flex h-[34px] w-[34px] items-center justify-center rounded-full border border-transparent text-[#4d5f82] transition-all duration-200 hover:border-[#dbe2ef] hover:bg-white hover:text-[#1f3d8f] hover:shadow-sm active:scale-95 cursor-pointer"
          aria-label="Notifications"
          title="Notifications"
        >
          <FiBell size={18} className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[8deg]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ef4444] ring-2 ring-white transition-transform duration-200 group-hover:scale-110" />
        </button>
        <button
          type="button"
          onClick={() => onOpenPanel("profile")}
          className="relative overflow-hidden h-[34px] w-[34px] rounded-full border border-[#dbe2ef] bg-gradient-to-b from-[#95badf] to-[#2d6ca8] flex items-center justify-center text-[12px] font-bold text-white cursor-pointer hover:opacity-90 transition"
          aria-label="User Profile"
        >
          {adminAvatar ? (
            <img
              src={adminAvatar}
              alt={adminName || "Admin Profile"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
      </div>
    </header>
  );
}
