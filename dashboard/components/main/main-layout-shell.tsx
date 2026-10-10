"use client";

import { useState, useEffect } from "react";
import { FiBell, FiInfo, FiUser } from "react-icons/fi";
import { Sidebar } from "@/components/main/sidebar";
import { Topbar } from "@/components/main/topbar";
import { useRouter } from "next/navigation";

type PanelType = "notifications" | "profile" | null;

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string | null;
};

const NOTIFICATION_POLL_MS = 60_000;

function timeAgo(value: string | null) {
  if (!value) return "";
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function MainLayoutShell({
  children
}: {
  children: React.ReactNode;
}) {
  const [panel, setPanel] = useState<PanelType>(null);
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store", signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: AdminNotification[]; unread?: number };
        if (!cancelled) {
          setNotifications(data.items ?? []);
          setUnread(Number(data.unread ?? 0));
        }
      } catch {
        // Keep the last list; the next poll retries.
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), NOTIFICATION_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const openPanel = (next: PanelType) => {
    setPanel(next);
    if (next === "notifications" && unread > 0) {
      // Seen once the panel is open; the unread highlight stays until the panel closes.
      setUnread(0);
      void fetch("/api/notifications/read", { method: "POST" }).catch(() => undefined);
    }
    if (next !== "notifications") {
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile", { signal: AbortSignal.timeout(15_000) });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.admin) {
            setAdminProfile(data.admin);
          }
        }
      } catch (e) {
        console.error("Failed to fetch admin profile", e);
      }
    };

    fetchProfile();

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setAdminProfile(customEvent.detail);
      } else {
        fetchProfile();
      }
    };

    window.addEventListener("admin-profile-updated", handleUpdate);
    return () => {
      window.removeEventListener("admin-profile-updated", handleUpdate);
    };
  }, []);

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr] max-[980px]:grid-cols-1 min-[981px]:h-screen min-[981px]:overflow-hidden">
      <Sidebar activePanel={panel} onOpenPanel={openPanel} />
      <main className="min-w-0 px-[14px] pb-[18px] min-[981px]:h-screen min-[981px]:overflow-y-auto">
        <Topbar
          onOpenPanel={openPanel}
          adminAvatar={adminProfile?.avatar}
          adminName={adminProfile?.name}
          unreadNotifications={unread}
        />
        {children}
      </main>

      <div
        className={`fixed inset-0 z-20 bg-black/40 transition-opacity ${
          panel ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setPanel(null)}
        aria-hidden
      />

      <aside
        className={`fixed right-0 top-0 z-30 h-full w-full max-w-[340px] border-l border-[#e6ecf7] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition-transform duration-300 ${
          panel ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {panel === "notifications" && (
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-[#e6ecf7] px-5 py-4">
              <h3 className="m-0 text-[14px] font-semibold text-[#1d2a43]">Notifications</h3>
              <button type="button" onClick={() => setPanel(null)} className="text-[#95a2b8] cursor-pointer bg-transparent border-0">
                x
              </button>
            </header>
            <div className="space-y-3 overflow-y-auto px-5 py-5">
              {notifications.length === 0 ? (
                <p className="m-0 rounded-xl bg-[#f8fafc] p-4 text-center text-[12px] text-[#6c7890]">You&apos;re all caught up.</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPanel(null);
                      if (item.link) router.push(item.link);
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition hover:border-[#8ca0d8] hover:bg-[#f3f7ff] cursor-pointer ${
                      item.read ? "border-[#e6ecf7] bg-white" : "border-[#c7d4f3] bg-[#f8fbff]"
                    }`}
                  >
                    <p className="m-0 flex items-center gap-2 text-[12px] font-semibold text-[#1f3d8f]">
                      <FiInfo size={14} /> {item.title}
                    </p>
                    <p className="m-0 mt-1 text-[12px] text-[#1f2d46]">{item.message}</p>
                    <p className="m-0 mt-1 text-[11px] text-[#6c7890]">{timeAgo(item.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {panel === "profile" && (
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-[#e6ecf7] px-5 py-4">
              <h3 className="m-0 text-[14px] font-semibold text-[#1d2a43]">User Profile</h3>
              <button type="button" onClick={() => setPanel(null)} className="text-[#95a2b8] cursor-pointer bg-transparent border-0">
                x
              </button>
            </header>
            <div className="space-y-5 overflow-y-auto px-6 py-6">
              <div className="mx-auto flex w-fit flex-col items-center">
                {adminProfile?.avatar ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#eef2f9]">
                    <img
                      src={adminProfile.avatar}
                      alt={adminProfile.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="avatar flex items-center justify-center text-[14px] font-semibold text-white">
                    {adminProfile?.name
                      ? adminProfile.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                      : "A"}
                  </div>
                )}
                <h4 className="m-0 mt-3 text-[16px] font-semibold text-[#1d2a43]">
                  {adminProfile?.name ?? "Admin User"}
                </h4>
                <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">
                  {adminProfile?.email ?? "admin@nunos.com"}
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-[#e6ecf7] px-3 py-2 text-[12px] text-[#314567] cursor-pointer hover:bg-slate-50 transition"
                >
                  <FiUser size={14} /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-[#e6ecf7] px-3 py-2 text-[12px] text-[#314567] cursor-pointer hover:bg-slate-50 transition"
                >
                  <FiBell size={14} /> Notification Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
