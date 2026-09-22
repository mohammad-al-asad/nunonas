import React from "react";

import { Bell } from "lucide-react";
import { NotificationsModal } from "./NotificationsModal";
import Link from "next/link";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Business Overview" }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  return (
    <header className="flex h-24 items-center justify-between px-10 bg-white border-b border-slate-100">
      <h2 className="text-3xl font-bold text-slate-800">{title}</h2>

      <div className="flex items-center space-x-6">
        <div className="relative" ref={notificationRef}>
          <div
            className="cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell className="h-6 w-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white"></span>
          </div>

          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        <Link
          href="/profile"
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"
            alt="User profile"
            className="h-12 w-12 rounded-full border-2 border-slate-200 group-hover:border-sky-400 transition-all"
          />
        </Link>
      </div>
    </header>
  );
}
