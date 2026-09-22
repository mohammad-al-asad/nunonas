"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useState } from "react";
import { vendorClearNotifications, vendorMarkNotificationRead } from "@/lib/vendor-api";
import { notificationsQuery, vendorQueryKeys } from "@/lib/vendor-queries";

type NotificationItem = { id: string; title?: string; message?: string; body?: string; created_at?: string; is_read?: boolean; read?: boolean };

export default function NotificationsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const notificationQuery = useQuery(notificationsQuery(100, 0));
  const items = (notificationQuery.data as { items?: NotificationItem[] } | undefined)?.items ?? [];
  const markRead = useMutation({ mutationFn: vendorMarkNotificationRead, onSuccess: (_data, id) => {
    queryClient.setQueriesData({ queryKey: ["vendor", "notifications"] }, (current: unknown) => {
      const payload = current as { items?: NotificationItem[]; unread_count?: number } | undefined;
      const items = payload?.items ?? [];
      const unreadCount =
        payload?.unread_count ??
        items.filter((item) => !(item.is_read ?? item.read ?? false)).length;
      return {
        ...(payload ?? {}),
        items: items.map((item) => item.id === id ? { ...item, is_read: true, read: true } : item),
        unread_count: Math.max(0, Number(unreadCount) - 1),
      };
    });
    queryClient.setQueryData(vendorQueryKeys.profile, (current: unknown) => {
      const profile = current as Record<string, unknown> | undefined;
      return { ...(profile ?? {}), unread_notifications: Math.max(0, Number(profile?.unread_notifications ?? 0) - 1) };
    });
  }});
  const clearAll = useMutation({ mutationFn: vendorClearNotifications, onSuccess: () => {
    queryClient.setQueriesData({ queryKey: ["vendor", "notifications"] }, (current: unknown) => ({ ...((current as object | undefined) ?? {}), items: [], unread_count: 0, total: 0 }));
    queryClient.setQueryData(vendorQueryKeys.profile, (current: unknown) => ({ ...((current as object | undefined) ?? {}), unread_notifications: 0 }));
  }});
  const mutationError = markRead.error ?? clearAll.error;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header title="Notifications" />
      <main className="mx-auto max-w-[1000px] space-y-6 p-4 sm:p-6 md:p-10">
        <div className="flex justify-end"><button type="button" onClick={() => setConfirmOpen(true)} disabled={clearAll.isPending || items.length === 0} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 px-4 py-3 text-sm font-black text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" />{clearAll.isPending ? "Clearing…" : "Clear all"}</button></div>
        {mutationError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{mutationError.message}</p> : null}
        {notificationQuery.isPending ? <div className="h-40 animate-pulse rounded-[32px] bg-white" /> : notificationQuery.isError ? <div className="rounded-[32px] bg-white p-10 text-center"><p className="text-sm text-red-600">Notifications could not be loaded.</p><button type="button" onClick={() => notificationQuery.refetch()} className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">Try again</button></div> : items.length === 0 ? <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400"><Bell className="mx-auto mb-3 h-8 w-8" />No notifications yet.</div> : null}
        <div className="space-y-3">{items.map((item) => { const unread = !(item.is_read ?? item.read ?? false); return <article key={item.id} className={`rounded-[28px] border bg-white p-5 shadow-sm sm:p-6 ${unread ? "border-sky-100" : "border-slate-100 opacity-70"}`}><div className="flex items-start justify-between gap-4"><div><h2 className="font-black text-slate-800">{item.title ?? "Notification"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.message ?? item.body ?? ""}</p><p className="mt-3 text-xs font-bold text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</p></div>{unread ? <button type="button" onClick={() => markRead.mutate(item.id)} disabled={markRead.isPending} aria-label="Mark notification read" className="rounded-xl bg-sky-50 p-3 text-sky-600 disabled:opacity-50"><Check className="h-4 w-4" /></button> : null}</div></article>; })}</div>
      </main>
      <ConfirmDialog open={confirmOpen} title="Clear all notifications?" message="This will remove all notifications from your portal." confirmLabel="Clear notifications" destructive busy={clearAll.isPending} onClose={() => setConfirmOpen(false)} onConfirm={() => { clearAll.mutate(); setConfirmOpen(false); }} />
    </div>
  );
}
