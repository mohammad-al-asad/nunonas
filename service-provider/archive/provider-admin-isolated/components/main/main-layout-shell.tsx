"use client";

import { useState, useEffect } from "react";
import { FiBell, FiCheckCircle, FiInfo, FiUser } from "react-icons/fi";
import { Sidebar } from "@/components/main/sidebar";
import { Topbar } from "@/components/main/topbar";
import { useRouter } from "next/navigation";

type PanelType = "notifications" | "profile" | null;

export function MainLayoutShell({
  children
}: {
  children: React.ReactNode;
}) {
  const [panel, setPanel] = useState<PanelType>(null);
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile");
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
      <Sidebar activePanel={panel} onOpenPanel={(next) => setPanel(next)} />
      <main className="min-w-0 px-[14px] pb-[18px] min-[981px]:h-screen min-[981px]:overflow-y-auto">
        <Topbar
          onOpenPanel={(next) => setPanel(next)}
          adminAvatar={adminProfile?.avatar}
          adminName={adminProfile?.name}
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
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  router.push("/vendors?status=PENDING");
                }}
                className="w-full text-left rounded-xl border border-[#e6ecf7] bg-[#f8fbff] p-3 transition hover:border-[#8ca0d8] hover:bg-[#f3f7ff] cursor-pointer"
              >
                <p className="m-0 flex items-center gap-2 text-[12px] font-semibold text-[#1f3d8f]">
                  <FiInfo size={14} /> New vendor signup pending review
                </p>
                <p className="m-0 mt-1 text-[11px] text-[#6c7890]">2 minutes ago</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  router.push("/billing");
                }}
                className="w-full text-left rounded-xl border border-[#e6ecf7] bg-white p-3 transition hover:border-[#8ca0d8] hover:bg-[#f3f7ff] cursor-pointer"
              >
                <p className="m-0 flex items-center gap-2 text-[12px] font-semibold text-[#0f766e]">
                  <FiCheckCircle size={14} /> Billing cycle completed successfully
                </p>
                <p className="m-0 mt-1 text-[11px] text-[#6c7890]">1 hour ago</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  router.push("/dashboard");
                }}
                className="w-full text-left rounded-xl border border-[#e6ecf7] bg-white p-3 transition hover:border-[#8ca0d8] hover:bg-[#f3f7ff] cursor-pointer"
              >
                <p className="m-0 flex items-center gap-2 text-[12px] font-semibold text-[#1f3d8f]">
                  <FiBell size={14} /> Weekly performance report is ready
                </p>
                <p className="m-0 mt-1 text-[11px] text-[#6c7890]">Today</p>
              </button>
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
