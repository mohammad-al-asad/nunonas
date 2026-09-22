"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorMarkNotificationRead } from "@/lib/vendor-api";
import { notificationsQuery, vendorQueryKeys } from "@/lib/vendor-queries";

interface NotificationItem {
  id: string;
  type: string;
  title?: string;
  message?: string;
  body?: string;
  created_at?: string;
  is_read?: boolean;
  read?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const queryClient = useQueryClient();
  const notificationQuery = useQuery({ ...notificationsQuery(20, 0), enabled: isOpen });
  const notifications = (notificationQuery.data as { items?: NotificationItem[] } | undefined)?.items ?? [];
  const markRead = useMutation({
    mutationFn: vendorMarkNotificationRead,
    onSuccess: (_result, id) => {
      queryClient.setQueriesData({ queryKey: ["vendor", "notifications"] }, (current: unknown) => {
        const payload = current as {
          items?: NotificationItem[];
          unread_count?: number;
        } | undefined;
        const items = payload?.items ?? [];
        const unreadCount =
          payload?.unread_count ??
          items.filter((item) => !(item.is_read ?? item.read ?? false)).length;
        return {
          ...(payload ?? {}),
          items: items.map((item) =>
            item.id === id ? { ...item, is_read: true, read: true } : item,
          ),
          unread_count: Math.max(0, Number(unreadCount) - 1),
        };
      });
      queryClient.setQueryData(vendorQueryKeys.profile, (current: unknown) => {
        const profile = current as Record<string, unknown> | undefined;
        return { ...(profile ?? {}), unread_notifications: Math.max(0, Number(profile?.unread_notifications ?? 0) - 1) };
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-label="Notifications" className="fixed inset-x-3 top-20 z-[100] animate-in fade-in zoom-in duration-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-4 sm:w-[min(480px,calc(100vw-2rem))]">
      <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white/95 shadow-2xl backdrop-blur-xl sm:rounded-[32px]">
        <div className="flex items-center justify-between border-b border-slate-100/50 p-5 pb-3 sm:p-6 sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500"><Bell className="h-5 w-5" /></div>
            <h2 className="text-xl font-black tracking-tight text-slate-800">Notifications</h2>
          </div>
          <button type="button" aria-label="Close notifications" onClick={onClose} className="group rounded-xl p-1.5 transition-all hover:bg-slate-100"><X className="h-5 w-5 text-slate-300 group-hover:text-slate-600" /></button>
        </div>

        <div className="max-h-[min(500px,65vh)] space-y-4 overflow-y-auto p-4 sm:p-6">
          {notificationQuery.isPending ? (
            <div className="flex items-center justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" /></div>
          ) : notificationQuery.isError ? (
            <div className="space-y-3 py-8 text-center text-sm text-red-600">
              <p>Notifications could not be loaded.</p>
              <button type="button" onClick={() => notificationQuery.refetch()} className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700">Try again</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No notifications yet.</div>
          ) : notifications.map((notification) => {
            const isUnread = !(notification.is_read ?? notification.read ?? false);
            const isBooking = notification.type === "booking" || notification.type?.includes("booking");
            return (
              <button
                type="button"
                key={notification.id}
                onClick={() => isUnread && markRead.mutate(notification.id)}
                disabled={markRead.isPending}
                className={cn(
                  "group relative block w-full rounded-3xl border bg-white/50 p-5 text-left transition-all",
                  isUnread ? "border-slate-100 hover:border-sky-200" : "border-slate-50 opacity-70",
                  markRead.isPending && "cursor-wait",
                )}
              >
                {isUnread ? <span className="absolute right-5 top-5 h-2 w-2 rounded-full bg-[#1e2a5e]" /> : null}
                <span className="flex gap-4">
                  <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", isBooking ? "bg-sky-50 text-sky-500" : "bg-amber-50 text-amber-500")}>
                    {isBooking ? <Calendar className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-base font-black text-slate-800">{notification.title ?? (isBooking ? "New Booking" : "New Notification")}</span>
                      {notification.created_at ? <span className="shrink-0 text-[10px] font-bold text-slate-400">{new Date(notification.created_at).toLocaleDateString()}</span> : null}
                    </span>
                    <span className="line-clamp-2 block pr-6 text-[11px] font-bold leading-relaxed text-slate-500">{notification.message ?? notification.body ?? ""}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center p-6 pt-0">
          <Link href="/notifications" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600">View all notifications</Link>
        </div>
      </div>
    </div>
  );
}
