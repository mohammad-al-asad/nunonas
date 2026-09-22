"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { Bell, Menu } from "lucide-react";
import { NotificationsModal } from "./NotificationsModal";
import Link from "next/link";
import { notificationsQuery, vendorProfileQuery } from "@/lib/vendor-queries";
import { dashboardHeaderForPath } from "@/lib/dashboard-title";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  openMobileNavigation,
  setNotificationsOpen,
} from "@/store/slices/portal-ui-slice";

interface HeaderProps {
  title?: string;
  description?: string;
  global?: boolean;
}

function providerInitials(profile: Record<string, unknown> | undefined) {
  const label = String(
    profile?.business_name ??
      profile?.name ??
      profile?.owner_full_name ??
      "Provider",
  ).trim();
  const words = label.split(/\s+/).filter(Boolean);
  if (!words.length) return "P";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function Header({ title, description, global = false }: HeaderProps) {
  if (!global) return null;
  return <HeaderContent title={title} description={description} />;
}

function HeaderContent({
  title,
  description,
}: Pick<HeaderProps, "title" | "description">) {
  const notificationRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isNotificationsOpen = useAppSelector(
    (state) => state.portalUi.notificationsOpen,
  );
  const profileQuery = useQuery(vendorProfileQuery());
  const notifications = useQuery(notificationsQuery(20, 0));
  const profile = profileQuery.data as Record<string, unknown> | undefined;
  const avatarUrl = String(profile?.avatar_url ?? profile?.profile_image_url ?? "");
  const notificationPayload = notifications.data as {
    items?: Array<{ is_read?: boolean; read?: boolean }>;
    unread_count?: number;
  } | undefined;
  const notificationItems = notificationPayload?.items ?? [];
  const unreadCount = notificationPayload
    ? Number(
        notificationPayload.unread_count ??
          notificationItems.filter(
            (item) => !(item.is_read ?? item.read ?? false),
          ).length,
      )
    : Number(profile?.unread_notifications ?? 0);
  const routeHeader = dashboardHeaderForPath(pathname);
  const resolvedTitle = title ?? routeHeader.title;
  const resolvedDescription = description ?? routeHeader.description;
  const initials = providerInitials(profile);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        dispatch(setNotificationsOpen(false));
      }
    }

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch, isNotificationsOpen]);

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 md:min-h-24 md:px-8 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(openMobileNavigation())}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
            {resolvedTitle}
          </h1>
          {resolvedDescription ? (
            <p className="mt-0.5 hidden truncate text-xs font-medium text-slate-400 sm:block md:text-sm">
              {resolvedDescription}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={isNotificationsOpen}
            className="cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() =>
              dispatch(setNotificationsOpen(!isNotificationsOpen))
            }
          >
            <Bell className="h-6 w-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => dispatch(setNotificationsOpen(false))}
          />
        </div>

        <Link
          href="/profile"
          className="flex items-center space-x-3 cursor-pointer group"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="User profile" width={48} height={48} sizes="48px" className="h-10 w-10 rounded-full border-2 border-slate-200 object-cover transition-all group-hover:border-sky-400 md:h-12 md:w-12" />
          ) : (
            <span
              aria-label={`${String(profile?.business_name ?? profile?.name ?? "Provider")} profile`}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-sm font-black text-slate-500 md:h-12 md:w-12"
            >
              {profileQuery.isPending ? "..." : initials}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
