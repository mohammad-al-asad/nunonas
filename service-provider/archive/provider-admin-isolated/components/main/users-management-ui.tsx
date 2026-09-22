"use client";

import Image from "next/image";
import { useState } from "react";
import {
  FiDownload,
  FiEye,
  FiFilter,
  FiSearch,
  FiSlash,
  FiUser,
  FiUserCheck,
  FiUsers
} from "react-icons/fi";
import type { ContactType, UserProfile, UserStatus } from "@/components/main/users-management-types";
import type { useUsersManagement } from "@/components/main/users-management-logic";

type UsersManagementUIProps = ReturnType<typeof useUsersManagement>;

function safeImageSrc(src: string | null | undefined, fallbackSeed: string) {
  const value = typeof src === "string" ? src.trim() : "";
  if (value.length > 0) {
    return value;
  }
  return `https://i.pravatar.cc/120?u=${encodeURIComponent(fallbackSeed)}`;
}

function statusClass(status: UserStatus) {
  if (status === "ACTIVE") {
    return "inline-flex rounded-full bg-[#dcf7ea] px-2 py-1 text-[10px] font-semibold tracking-[0.02em] text-[#137f56]";
  }
  return "inline-flex rounded-full bg-[#fde7e7] px-2 py-1 text-[10px] font-semibold tracking-[0.02em] text-[#c23131]";
}

function summaryIcon(icon: UsersManagementUIProps["summaryCards"][number]["icon"]) {
  if (icon === "users") return <FiUsers size={20} />;
  if (icon === "user") return <FiUser size={20} />;
  if (icon === "blocked") return <FiSlash size={18} />;
  return <FiUserCheck size={18} />;
}

function SectionIcon({ type }: { type: ContactType }) {
  if (type === "mail") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8fa0bf]">
        <path d="M3 6h18v12H3V6Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8fa0bf]">
        <path
          d="M6.5 3.5 10 3l2 4.5-2.5 1.7a16 16 0 0 0 5.2 5.2l1.8-2.5L21 14l-.5 3.5c-.2 1.1-1.2 1.9-2.4 1.8-7.3-.7-13.3-6.7-14-14-.1-1.2.7-2.2 1.8-2.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8fa0bf]">
      <path
        d="M12 21s6-6.4 6-11a6 6 0 1 0-12 0c0 4.6 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function UsersManagementUI({
  pagedUsers,
  filteredUsers,
  summaryCards,
  selectedUser,
  query,
  statusFilter,
  filtersOpen,
  page,
  totalPages,
  paginationItems,
  pageSize,
  showAllBookings,
  setSelectedUserId,
  setQuery,
  setStatusFilter,
  setFiltersOpen,
  setPage,
  setShowAllBookings,
  persistUserAction
}: UsersManagementUIProps) {
  const [pendingStatusAction, setPendingStatusAction] = useState<{
    userId: string;
    userName: string;
    action: "block" | "unblock";
  } | null>(null);

  const requestStatusAction = (user: UserProfile) => {
    setPendingStatusAction({
      userId: user.id,
      userName: user.name,
      action: user.status === "BLOCKED" ? "unblock" : "block",
    });
  };

  const confirmStatusAction = () => {
    if (!pendingStatusAction) {
      return;
    }
    persistUserAction(pendingStatusAction.userId, pendingStatusAction.action);
    setPendingStatusAction(null);
  };

  const exportCsv = () => {
    const headers = ["User ID", "Name", "Email", "Status", "Total Bookings", "Joined Date"];
    const rows = filteredUsers.map((user: UserProfile) => [
      user.id,
      user.name,
      user.email,
      user.status,
      user.totalBookings.toString(),
      user.joinedDate
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safe = value.replace(/\"/g, "\"\"");
            return `"${safe}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    link.href = url;
    link.download = `users-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="relative space-y-4">
      <div className="space-y-4">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {summaryCards.map((item) => (
            <article key={item.label} className="rounded-xl border border-[#dbe2ef] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${item.iconWrap}`}>
                  {summaryIcon(item.icon)}
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.tone}`}>
                  {item.trend}
                </span>
              </div>
              <p className="m-0 text-[11px] tracking-[0.05em] text-[#70809d]">{item.label}</p>
              <h3 className="m-0 mt-1 text-[39px] leading-none text-[#1d2a43]">{item.value}</h3>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-[#dbe2ef] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-lg border border-[#edf1fa] bg-[#f7f9fd] px-3">
              <FiSearch size={13} className="text-[#8b96ad]" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full border-0 bg-transparent text-[12px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
              />
            </div>
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev: boolean) => !prev)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe2ef] bg-white px-4 text-[13px] text-[#3a4b70]"
              >
                <FiFilter size={12} />
                Filters
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe2ef] bg-white px-4 text-[13px] text-[#3a4b70]"
              >
                <FiDownload size={12} />
                Export CSV
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-11 z-10 w-40 rounded-lg border border-[#e6ecf7] bg-white p-2 text-[12px] text-[#3a4b70] shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setFiltersOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                      statusFilter === "ALL" ? "bg-[#f3f6fd] font-semibold text-[#1f3d8f]" : ""
                    }`}
                  >
                    All users
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("ACTIVE");
                      setFiltersOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                      statusFilter === "ACTIVE" ? "bg-[#f3f6fd] font-semibold text-[#1f3d8f]" : ""
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("BLOCKED");
                      setFiltersOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                      statusFilter === "BLOCKED" ? "bg-[#f3f6fd] font-semibold text-[#1f3d8f]" : ""
                    }`}
                  >
                    Blocked
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-hidden px-4">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["USER ID", "NAME", "STATUS", "TOTAL BOOKINGS", "JOINED DATE", "ACTIONS"].map((head) => (
                    <th
                      key={head}
                      className="border-b border-[#edf1fa] px-4 py-3 text-left text-[11px] tracking-[0.04em] text-[#6e7f9b]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((user: UserProfile, index: number) => (
                  <tr key={`${user.id || user.email || user.name}-${index}`} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[12px] text-[#9aa6c0] ">{user.id}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={safeImageSrc(user.avatar, user.id || user.email || user.name)}
                          alt={user.name}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-full"
                        />
                        <div>
                          <div className="text-[13px] font-semibold text-[#1f2d46]">{user.name}</div>
                          <div className="text-[11px] text-[#7f8ea9]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <span className={statusClass(user.status)}>{user.status}</span>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 font-semibold text-[#2f3f60]">{user.totalBookings}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[13px] text-[#6e7f9b]">{user.joinedDate}</td>
                    <td className="border-b border-[#edf1fa] px-4 py-4 text-[#60749d]">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className="text-[#294f99]"
                          aria-label={`View ${user.name} profile`}
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            requestStatusAction(user);
                          }}
                          className={user.status === "BLOCKED" ? "text-[#16a34a]" : "text-[#ef4444]"}
                          aria-label={`${user.status === "BLOCKED" ? "Restore" : "Block"} ${user.name}`}
                        >
                          <FiSlash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between px-4 py-4 text-[11px] text-[#7f8ea9]">
            <span>
              Showing {filteredUsers.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev: number) => Math.max(1, prev - 1))}
                className={`rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] ${
                  page === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
                }`}
                aria-disabled={page === 1}
              >
                Previous
              </button>
              {paginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <span key={`ellipsis-${index}`} className="px-1 text-[#a1aac0]">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`grid h-6 w-6 place-items-center rounded text-[11px] ${
                      item === page ? "bg-[#1f3d8f] text-white" : "border border-[#e6ecf7] text-[#64748b]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((prev: number) => Math.min(totalPages, prev + 1))}
                className={`rounded border border-[#e6ecf7] px-2 py-0.5 text-[10px] ${
                  page === totalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
                }`}
                aria-disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </div>

      <div
        className={`fixed inset-0 z-20 ${selectedUser ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => setSelectedUserId(null)}
        aria-hidden
      />

      <aside
        className={`fixed right-0 top-0 z-30 h-full w-full max-w-[320px] border-l border-[#e6ecf7] bg-white shadow-sm transition-transform duration-300 ${
          selectedUser ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedUser && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-[#eef2f9] px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="flex items-center gap-2 text-[12px] text-[#95a2b8]"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full border border-[#e1e8f5] text-[11px]">x</span>
                <span>User Details</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto mb-6 flex w-fit flex-col items-center">
                <div className="relative">
                  <Image
                    src={safeImageSrc(selectedUser.avatar, selectedUser.id || selectedUser.email || selectedUser.name)}
                    alt={selectedUser.name}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] rounded-full border-[3px] border-[#eef2f9]"
                  />
                  <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-[#18b67a]" />
                </div>
                <h3 className="m-0 mt-3 text-[18px] font-semibold text-[#1d2a43]">{selectedUser.name}</h3>
                <p className="m-0 mt-1 text-[11px] text-[#7d8ba6]">
                  {selectedUser.id} &bull; Member since {selectedUser.memberSince}
                </p>
                <p className="m-0 mt-1 text-[11px] text-[#8fa0bf]">
                  {selectedUser.age > 0 ? `Age ${selectedUser.age}` : "Age unavailable"}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-2.5">
                <div className="rounded-lg bg-[#f5f7fb] px-2 py-3 text-center">
                  <p className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad]">BOOKINGS</p>
                  <p className="m-0 mt-1 text-[16px] font-semibold text-[#1f3d8f]">{selectedUser.stats.bookings}</p>
                </div>
                <div className="rounded-lg bg-[#f5f7fb] px-2 py-3 text-center">
                  <p className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad]">SPENT</p>
                  <p className="m-0 mt-1 text-[16px] font-semibold text-[#1f3d8f]">{selectedUser.stats.spent}</p>
                </div>
                <div className="rounded-lg bg-[#f5f7fb] px-2 py-3 text-center">
                  <p className="m-0 text-[9px] tracking-[0.12em] text-[#8b96ad]">RATING</p>
                  <p className="m-0 mt-1 text-[16px] font-semibold text-[#1f3d8f]">{selectedUser.stats.rating}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="m-0 mb-3 text-[11px] tracking-[0.12em] text-[#8b96ad] uppercase">Contact Information</h4>
                <div className="space-y-3">
                  {selectedUser.contacts.map((contact, index) => (
                    <div key={`${contact.label}-${contact.value}-${index}`} className="flex items-start gap-2">
                      <SectionIcon type={contact.type} />
                      <p className="m-0 text-[12px] text-[#1f2d46]">
                        <span className="block text-[10px] text-[#8b96ad]">{contact.label}</span>
                        {contact.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="m-0 text-[11px] tracking-[0.12em] text-[#8b96ad] uppercase">Recent Bookings</h4>
                  <button
                    type="button"
                    onClick={() => setShowAllBookings((prev: boolean) => !prev)}
                    className="text-[11px] font-semibold text-[#1f3d8f]"
                  >
                    {showAllBookings ? "Hide" : "View All"}
                  </button>
                </div>
                <div className="space-y-2">
                  {(showAllBookings ? selectedUser.recentBookings : selectedUser.recentBookings.slice(0, 2)).map(
                    (booking, index) => (
                      <div key={`${booking.hotel}-${booking.range}-${index}`} className="flex items-center gap-2 rounded-lg border border-[#eef2f9] bg-white p-2">
                        <Image
                          src={safeImageSrc(booking.image, `${selectedUser.id}-${booking.hotel}`)}
                          alt={booking.hotel}
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate text-[11px] font-semibold text-[#1f2d46]">{booking.hotel}</p>
                          <p className="m-0 text-[9px] text-[#8b96ad]">{booking.range}</p>
                        </div>
                        <div className="text-right">
                          <p className="m-0 text-[12px] font-semibold text-[#1f2d46]">{booking.amount}</p>
                          <p className="m-0 text-[9px] font-semibold text-[#18b67a]">{booking.status}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#eef2f9] px-6 py-4">
              {selectedUser.actions.map((action, index) => (
                <button
                  key={`${action.label}-${index}`}
                  type="button"
                  onClick={() => {
                    if (action.label.toLowerCase().includes("block") || action.label.toLowerCase().includes("unblock")) {
                      requestStatusAction(selectedUser);
                    }
                    if (action.label.toLowerCase().includes("reset password")) {
                      persistUserAction(selectedUser.id, "resetPassword");
                    }
                  }}
                  className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-left text-[13px] ${
                    action.tone === "danger"
                      ? "border-[#fde1e1] bg-white text-[#eb3b3b]"
                      : "border-[#e6ecf7] bg-white text-[#4e5f83]"
                  }`}
                >
                  <span>{action.label}</span>
                  {action.label.toLowerCase().includes("block") ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 16L16 8" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 12a6 6 0 1 0 2-4.5" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M4 5v4h4" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {pendingStatusAction && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">
              Confirm {pendingStatusAction.action === "block" ? "Block" : "Unblock"}
            </h3>
            <p className="m-0 mt-3 text-[13px] leading-6 text-[#60718f]">
              {pendingStatusAction.action === "block"
                ? `Block ${pendingStatusAction.userName}? This action will restrict the user from accessing their account.`
                : `Unblock ${pendingStatusAction.userName}? This action will restore the user account access.`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingStatusAction(null)}
                className="inline-flex h-10 items-center rounded-xl border border-[#dbe2ef] px-4 text-[13px] font-medium text-[#4e5f83]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusAction}
                className={`inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-semibold text-white ${
                  pendingStatusAction.action === "block" ? "bg-[#dc2626]" : "bg-[#15803d]"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
