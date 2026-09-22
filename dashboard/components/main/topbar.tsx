"use client";

import { FiBell } from "react-icons/fi";
import { usePathname } from "next/navigation";

const titleByRoute: Record<string, string> = {
  "/dashboard": "Platform Overview",
  "/users": "User Management",
  "/vendors": "Vendors Management",
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
          className="relative inline-flex text-[#4d5f82]"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
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
