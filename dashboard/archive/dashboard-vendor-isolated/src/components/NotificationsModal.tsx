"use client";

import React from "react";
import {
  X,
  Calendar,
  Star,
  CheckCircle2,
  ChevronRight,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "booking" | "review";
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  customer?: string;
  details?: string;
}

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "booking",
    title: "New Booking Received",
    message:
      'Sarah Miller has requested a "Deep Home Cleaning" for tomorrow at 10:00 AM.',
    time: "2 mins ago",
    isUnread: true,
  },
  {
    id: "2",
    type: "booking",
    title: "New Booking Received",
    message:
      'Sarah Miller has requested a "Deep Home Cleaning" for tomorrow at 10:00 AM.',
    time: "2 mins ago",
    isUnread: true,
  },
  {
    id: "3",
    type: "review",
    title: "New Review Posted",
    message:
      '"Excellent service! The team was professional and very thorough." - David K.',
    time: "45 mins ago",
    isUnread: true,
  },
  {
    id: "4",
    type: "review",
    title: "New Review Posted",
    message:
      '"Excellent service! The team was professional and very thorough." - David K.',
    time: "45 mins ago",
    isUnread: true,
  },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({
  isOpen,
  onClose,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-4 w-[480px] z-[100] animate-in fade-in zoom-in duration-200">
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 pb-3 flex items-center justify-between border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Notifications
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[500px]">
          {DUMMY_NOTIFICATIONS.map((notif) => (
            <div
              key={notif.id}
              className="relative p-5 bg-white/50 rounded-3xl border border-slate-100 hover:border-sky-200 transition-all group"
            >
              {notif.isUnread && (
                <div className="absolute top-5 right-5 h-2 w-2 bg-[#1e2a5e] rounded-full" />
              )}

              <div className="flex gap-4">
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                    notif.type === "booking"
                      ? "bg-sky-50 text-sky-500"
                      : "bg-amber-50 text-amber-500",
                  )}
                >
                  {notif.type === "booking" ? (
                    <Calendar className="h-5 w-5" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-800">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed pr-6 line-clamp-2">
                    {notif.message}
                  </p>

                  <div className="pt-3 flex items-center gap-2">
                    {notif.type === "booking" ? (
                      <>
                        <button className="px-4 py-2 bg-[#1e2a5e] text-white rounded-lg text-[10px] font-black transition-all hover:bg-[#1a234d] shadow-lg shadow-[#1e2a5e]/10">
                          Accept Request
                        </button>
                        <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black transition-all hover:bg-slate-100 border border-slate-100">
                          Details
                        </button>
                      </>
                    ) : (
                      <button className="text-[10px] font-black text-[#1e2a5e] flex items-center gap-1 hover:gap-2 transition-all">
                        Reply to Review <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 pt-0 flex justify-center">
          <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
}
