"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserProfile, UserStatus } from "@/components/main/users-management-types";
import { UserDetailSkeleton } from "@/components/users/detail-skeleton";

const refreshIntervalMs = 30_000;

function safeImageSrc(src: string | null | undefined) {
  const value = typeof src === "string" ? src.trim() : "";
  return value.length > 0 ? value : null;
}

function userInitial(name: string) {
  const value = name.trim();
  return value ? value.charAt(0).toUpperCase() : "U";
}

function avatarPalette(seed: string) {
  const palettes = [
    "bg-[#dbe7ff] text-[#1f3d8f]",
    "bg-[#dff7ec] text-[#137f56]",
    "bg-[#ffe7d6] text-[#c46a12]",
    "bg-[#f6e1ff] text-[#8b3bb0]",
    "bg-[#fde2ea] text-[#be3455]",
    "bg-[#e6ecf7] text-[#415a92]",
  ];

  const normalized = seed.trim() || "user";
  const hash = Array.from(normalized).reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function Avatar({
  src,
  name,
  seed,
  size,
}: {
  src: string | null | undefined;
  name: string;
  seed: string;
  size: number;
}) {
  const imageSrc = safeImageSrc(src);
  const dimensionClass = size === 88 ? "h-[88px] w-[88px] text-[30px]" : "h-10 w-10 text-[14px]";

  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={name}
        width={size}
        height={size}
        className={`${dimensionClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${dimensionClass} ${avatarPalette(seed)} grid place-items-center rounded-full font-semibold`}
    >
      {userInitial(name)}
    </div>
  );
}

function statusClass(status: UserStatus) {
  if (status === "ACTIVE") {
    return "bg-[#dcf7ea] text-[#137f56]";
  }
  return "bg-[#fde7e7] text-[#c23131]";
}

function formatDateTime(value: string) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

async function fetchUserDetail(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal });
  if (response.status === 404) {
    return { user: null, notFound: true };
  }
  if (!response.ok) {
    throw new Error("Failed to load user details");
  }
  const payload = (await response.json()) as { user?: UserProfile };
  return { user: payload.user ?? null, notFound: false };
}

async function updateUserAction(id: string, action: "block" | "unblock" | "resetPassword") {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  const payload = (await response.json()) as { user?: UserProfile };
  return payload.user ?? null;
}

export function UserDetailPageClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pendingAction, setPendingAction] = useState<"block" | "unblock" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadUser = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchUserDetail(userId, signal);
      setUser(result.user);
      setNotFound(result.notFound);
    } catch (loadError) {
      if ((loadError as { name?: string }).name !== "AbortError") {
        setError("Failed to load live user details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadUser(controller.signal);

    const intervalId = window.setInterval(() => {
      void loadUser();
    }, refreshIntervalMs);

    const handleWindowRefresh = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadUser();
    };

    window.addEventListener("focus", handleWindowRefresh);
    document.addEventListener("visibilitychange", handleWindowRefresh);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowRefresh);
      document.removeEventListener("visibilitychange", handleWindowRefresh);
    };
  }, [userId]);

  const submitAction = async () => {
    if (!pendingAction) {
      return;
    }

    setActionBusy(true);
    setError(null);

    try {
      const updatedUser = await updateUserAction(userId, pendingAction);
      if (updatedUser) {
        setUser(updatedUser);
      }
      setPendingAction(null);
      await loadUser();
    } catch {
      setError("Failed to update user status.");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !user) {
    return <UserDetailSkeleton />;
  }

  if (error && !user) {
    return (
      <div className="rounded-3xl border border-[#fee2e2] bg-[#fff5f5] p-6 text-[#b91c1c]">
        {error}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-3xl border border-[#e6ecf7] bg-white p-6 text-[#60718f]">
        User not found.
      </div>
    );
  }

  if (!user) {
    return <UserDetailSkeleton />;
  }

  const statusAction = user.status === "BLOCKED" ? "unblock" : "block";

  return (
    <section className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8b96ad]">
            User management
          </p>
          <h1 className="m-0 mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#18233c]">
            {user.name}
          </h1>
          <p className="m-0 mt-2 text-[13px] text-[#60718f]">
            Live user profile view with current contact details, activity, and recent bookings.
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex h-10 items-center rounded-xl border border-[#dbe2ef] px-4 text-[13px] font-medium text-[#4e5f83]"
        >
          Back
        </Link>
      </div>

      <section className="rounded-[28px] border border-[#e6ecf7] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <Avatar
              src={user.avatar}
              name={user.name}
              seed={user.id || user.email || user.name}
              size={88}
            />
            <div className="space-y-3">
              <div>
                <h2 className="m-0 text-[24px] font-semibold text-[#1d2a43]">{user.name}</h2>
                <p className="m-0 mt-1 text-[14px] text-[#60718f]">{user.email || "No email provided"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-[11px] font-semibold text-[#64748b]">
                  User ID: {user.id}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(user.status)}`}>
                  {user.status}
                </span>
              </div>
              <div className="grid gap-3 text-[13px] text-[#1f2d46] sm:grid-cols-2">
                {user.contacts.map((contact) => (
                  <p key={`${contact.label}-${contact.value}`} className="m-0 break-words">
                    <span className="font-semibold">{contact.label}:</span> {contact.value}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-[#8b96ad]">Bookings</p>
              <p className="m-0 mt-2 text-[32px] leading-none text-[#1d2a43]">{user.stats.bookings}</p>
              <p className="m-0 mt-2 text-[11px] text-[#7b89a3]">Total completed reservations</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-[#8b96ad]">Spent</p>
              <p className="m-0 mt-2 text-[24px] font-semibold text-[#1d2a43]">{user.stats.spent}</p>
              <p className="m-0 mt-2 text-[11px] text-[#7b89a3]">Lifetime booking spend</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#e6ecf7] bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">User actions</h3>
            <p className="m-0 mt-1 text-[12px] text-[#7b89a3]">Manage user access directly from this page.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPendingAction(statusAction)}
              disabled={actionBusy}
              className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-[13px] font-semibold ${
                user.status === "BLOCKED"
                  ? "border border-[#d7f2e3] bg-[#f0fdf4] text-[#15803d]"
                  : "border border-[#fecaca] bg-[#fff5f5] text-[#dc2626]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {user.status === "BLOCKED" ? "Unblock Account" : "Block Account"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <article className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Account overview</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Joined date</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{user.joinedDate}</p>
              </div>
              <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Member since</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{user.memberSince}</p>
              </div>
              <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Age</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">
                  {user.age > 0 ? `${user.age}` : "Unavailable"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Points balance</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{user.pointsBalance.toLocaleString()}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Recent bookings</h3>
            <p className="m-0 mt-1 text-[12px] text-[#7b89a3]">Latest user booking activity from the backend.</p>
            <div className="mt-5 space-y-3">
              {user.recentBookings.length > 0 ? (
                user.recentBookings.map((booking, index) => (
                  <div
                    key={`${booking.id || booking.hotel}-${booking.range}-${index}`}
                    className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img src={booking.image} alt="" className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-28" />
                      <div className="min-w-0">
                        <p className="m-0 text-[14px] font-semibold text-[#1f2d46]">{booking.hotel}</p>
                        <p className="m-0 mt-1 text-[12px] text-[#7b89a3]">{booking.service} · {booking.range}</p>
                        <div className="mt-3 grid gap-x-6 gap-y-1 text-[12px] text-[#60718f] sm:grid-cols-2">
                          <span><b className="text-[#334155]">When:</b> {booking.date || booking.range}{booking.time ? ` at ${booking.time}` : ""}</span>
                          <span><b className="text-[#334155]">Guests:</b> {booking.guests}</span>
                          <span><b className="text-[#334155]">Staff:</b> {booking.staff}</span>
                          <span><b className="text-[#334155]">Seating:</b> {booking.seating}</span>
                          <span><b className="text-[#334155]">Payment:</b> {booking.paymentStatus}</span>
                        {booking.bookingCode ? <span><b className="text-[#334155]">Booking ID:</b> {booking.bookingCode}</span> : null}
                        {booking.checkIn || booking.checkOut ? <span><b className="text-[#334155]">Stay:</b> {booking.checkIn || "-"} to {booking.checkOut || "-"}</span> : null}
                      </div>
                      <div className="mt-3 grid gap-2 border-t border-[#e5eaf2] pt-3 text-[11px] text-[#60718f] sm:grid-cols-2">
                        <span><b className="text-[#334155]">Request sent:</b> {formatDateTime(booking.requestedAt)}</span>
                        <span><b className="text-[#334155]">Accepted:</b> {booking.acceptedAt ? formatDateTime(booking.acceptedAt) : "Not recorded"}</span>
                        {booking.completedAt ? <span><b className="text-[#334155]">Completed:</b> {formatDateTime(booking.completedAt)}</span> : null}
                        {booking.canceledAt ? <span><b className="text-[#334155]">Cancelled:</b> {formatDateTime(booking.canceledAt)}</span> : null}
                      </div>
                      <p className="m-0 mt-2 text-[12px] text-[#60718f]"><b className="text-[#334155]">Notes:</b> {booking.notes}</p>
                      {booking.statusNote ? <p className="m-0 mt-1 text-[12px] text-[#60718f]"><b className="text-[#334155]">Provider status note:</b> {booking.statusNote}</p> : null}
                      {booking.statusHistory.length > 0 ? <div className="mt-3 space-y-1 border-t border-[#e5eaf2] pt-2 text-[11px] text-[#60718f]">{booking.statusHistory.map((event, eventIndex) => <p key={`${event.status}-${event.at}-${eventIndex}`} className="m-0"><b className="text-[#334155]">{event.label || `${String(event.status || "Status").replaceAll("_", " ")} by ${event.actor === "customer" ? "customer" : "service provider"}`}:</b> {formatDateTime(String(event.at || ""))}</p>)}</div> : null}
                        {booking.createdAt ? <p className="m-0 mt-1 text-[11px] text-[#94a3b8]">Booked {formatDateTime(booking.createdAt)}</p> : null}
                      </div>
                      <div className="ml-auto flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[10px] font-semibold text-[#1f3d8f]">{booking.status}</span>
                        <span className="text-[13px] font-semibold text-[#1d2a43]">{booking.amount}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-4 text-[13px] text-[#60718f]">
                  No recent bookings found for this user.
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Profile metadata</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Created at</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{formatDateTime(user.createdAt)}</p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Last updated</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{formatDateTime(user.updatedAt)}</p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">Rating</p>
                <p className="m-0 mt-2 text-[13px] leading-6 text-[#1f2d46]">{user.stats.rating}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">Contact details</h3>
            <div className="mt-4 grid gap-3">
              {user.contacts.map((contact) => (
                <div key={`${contact.label}-${contact.value}`} className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                  <p className="m-0 text-[10px] uppercase tracking-[0.08em] text-[#94a3b8]">{contact.label}</p>
                  <p className="m-0 mt-2 break-words text-[13px] leading-6 text-[#1f2d46]">{contact.value}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {pendingAction ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">
              Confirm {pendingAction === "block" ? "Block" : "Unblock"}
            </h3>
            <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
              {pendingAction === "block"
                ? `Block ${user.name}? This action will restrict the user from accessing the account.`
                : `Unblock ${user.name}? This action will restore the user account access.`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionBusy}
                className="inline-flex h-10 items-center rounded-xl border border-[#dbe2ef] px-4 text-[13px] font-medium text-[#4e5f83] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={actionBusy}
                className={`inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-white disabled:opacity-50 ${
                  pendingAction === "block" ? "bg-[#dc2626]" : "bg-[#15803d]"
                }`}
              >
                {actionBusy ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
