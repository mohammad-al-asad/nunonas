"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FiAlertCircle, FiCheck, FiChevronLeft, FiChevronRight, FiEye, FiFilter, FiInbox, FiSearch, FiSliders } from "react-icons/fi";
import {
  type RequesterType,
  type SupportTicket,
  type TicketPriority as Priority,
  type TicketStatus,
  mapSupportTicket
} from "@/lib/support";

// New messages from users/providers are picked up by polling (there is no push channel).
const REFRESH_INTERVAL_MS = 20_000;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function Avatar({ ticket, size }: { ticket: SupportTicket; size: number }) {
  if (ticket.avatar) {
    return <Image src={ticket.avatar} alt={ticket.userName} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${ticket.requesterType === "vendor" ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#e6efff] text-[#1f3d8f]"}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials(ticket.userName)}
    </span>
  );
}

function RoleBadge({ ticket }: { ticket: SupportTicket }) {
  return (
    <span
      className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
        ticket.requesterType === "vendor" ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#e6efff] text-[#1f3d8f]"
      }`}
    >
      {ticket.userRole}
    </span>
  );
}

function ticketStatusClass(status: TicketStatus) {
  if (status === "Open") return "bg-[#dbeafe] text-[#1d4ed8]";
  if (status === "Resolved") return "bg-[#dcfce7] text-[#15803d]";
  return "bg-[#fef3c7] text-[#b45309]";
}

function summaryIcon(i: number) {
  if (i === 1) return "bg-[#e6efff] text-[#1f3d8f]";
  if (i === 2) return "bg-[#e8f8ef] text-[#16a34a]";
  if (i === 3) return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#ede9fe] text-[#3b1e8a]";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

const pageSize = 5;

export function SupportDashboardView({ data }: { data: { tickets: SupportTicket[] } }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(data.tickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | Priority>("ALL");
  const [requesterFilter, setRequesterFilter] = useState<"ALL" | RequesterType>("ALL");
  const [page, setPage] = useState(1);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<"reply" | "status" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets]
  );

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        ticket.id.toLowerCase().includes(normalizedQuery) ||
        ticket.userName.toLowerCase().includes(normalizedQuery) ||
        ticket.subject.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || ticket.priority === priorityFilter;
      const matchesRequester = requesterFilter === "ALL" || ticket.requesterType === requesterFilter;
      return matchesQuery && matchesStatus && matchesPriority && matchesRequester;
    });
  }, [tickets, query, statusFilter, priorityFilter, requesterFilter]);

  // Summary cards come from the same list, so they change as soon as a ticket does.
  const summaryCards = useMemo(() => {
    const count = (status: TicketStatus) => tickets.filter((ticket) => ticket.status === status).length;
    return [
      { label: "TOTAL TICKETS", value: tickets.length, icon: <FiInbox size={16} /> },
      { label: "IN PROGRESS", value: count("In Progress"), icon: <FiSliders size={16} /> },
      { label: "RESOLVED", value: count("Resolved"), icon: <FiCheck size={16} /> },
      { label: "OPEN", value: count("Open"), icon: <FiAlertCircle size={16} /> }
    ];
  }, [tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const pagedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];

    if (page <= 3) {
      items.push(2, 3, "ellipsis", totalPages);
      return items;
    }

    if (page >= totalPages - 2) {
      items.push("ellipsis", totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
    return items;
  }, [page, totalPages]);

  const replaceTicket = (updated: SupportTicket) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
  };

  const sendTicketUpdate = async (kind: "reply" | "status", init: RequestInit, path: string) => {
    if (!selectedTicketId) return false;
    setBusy(kind);
    setActionError(null);
    try {
      const response = await fetch(`/api/support/${encodeURIComponent(selectedTicketId)}/${path}`, {
        ...init,
        headers: { "Content-Type": "application/json" }
      });
      const payload = (await response.json().catch(() => ({}))) as { detail?: string };
      if (!response.ok) throw new Error(payload.detail || "The update didn't go through. Please try again.");
      replaceTicket(mapSupportTicket(payload));
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The update didn't go through. Please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleSendReply = () => {
    const message = reply.trim();
    if (!message || busy) return;
    void sendTicketUpdate("reply", { method: "POST", body: JSON.stringify({ message, name: "Support Agent" }) }, "messages").then((ok) => {
      if (ok) setReply("");
    });
  };

  const handleStatusUpdate = (nextStatus: TicketStatus) => {
    if (busy || selectedTicket?.status === nextStatus) return;
    void sendTicketUpdate("status", { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }, "status");
  };

  const refreshTickets = useCallback(async () => {
    try {
      const response = await fetch("/api/support", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { tickets?: SupportTicket[] };
      if (Array.isArray(payload.tickets)) setTickets(payload.tickets);
    } catch {
      // Keep showing the current list; the next refresh will try again.
    }
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void refreshTickets();
    };
    const timer = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [refreshTickets]);

  useEffect(() => {
    setActionError(null);
  }, [selectedTicketId]);

  // Keep the newest message in view when a ticket opens or a message arrives.
  const messageCount = selectedTicket?.conversation.length ?? 0;
  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [selectedTicketId, messageCount]);

  return (
    <section className="relative space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className={`grid h-9 w-9 place-items-center rounded-full ${summaryIcon(i)}`}>{card.icon}</div>
              <div>
                <p className="m-0 text-[10px] text-[#7d8ba6]">{card.label}</p>
                <h3 className="m-0 text-[20px] font-semibold text-[#1d2a43]">{card.value.toLocaleString()}</h3>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex h-9 w-full max-w-[520px] items-center gap-2 rounded-full border border-[#e6ecf7] bg-[#f7f9fd] px-3">
            <FiSearch size={12} className="text-[#8b96ad]" />
            <input
              type="text"
              placeholder="Search by Ticket ID, User, or Subject..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="w-full border-0 bg-transparent text-[11px] text-[#2b3a59] outline-none placeholder:text-[#9aa6c0]"
            />
          </div>
          <div className="relative flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center rounded-full border border-[#e6ecf7] bg-[#f7f9fd] p-0.5 text-[11px]" role="radiogroup" aria-label="Who opened the ticket">
              {([
                ["ALL", "Everyone"],
                ["user", "Users"],
                ["vendor", "Providers"]
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={requesterFilter === value}
                  onClick={() => {
                    setRequesterFilter(value);
                    setPage(1);
                  }}
                  className={`h-full rounded-full px-3 ${requesterFilter === value ? "bg-white font-semibold text-[#1f3d8f] shadow-sm" : "text-[#64748b]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusOpen((prev) => !prev);
                setPriorityOpen(false);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
            >
              {statusFilter === "ALL" ? "All Statuses" : statusFilter}
              <FiFilter size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setPriorityOpen((prev) => !prev);
                setStatusOpen(false);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
            >
              {priorityFilter === "ALL" ? "All Priority" : priorityFilter}
              <FiFilter size={12} />
            </button>

            {statusOpen && (
              <div className="absolute right-[132px] top-11 z-10 w-36 rounded-lg border border-[#e6ecf7] bg-white p-2 text-[11px] text-[#3a4b70] shadow-sm">
                {(["ALL", "Open", "In Progress", "Resolved"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                      setStatusOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                      statusFilter === status ? "bg-[#f3f6fd] font-semibold text-[#1f3d8f]" : ""
                    }`}
                  >
                    {status === "ALL" ? "All Statuses" : status}
                  </button>
                ))}
              </div>
            )}

            {priorityOpen && (
              <div className="absolute right-0 top-11 z-10 w-36 rounded-lg border border-[#e6ecf7] bg-white p-2 text-[11px] text-[#3a4b70] shadow-sm">
                {(["ALL", "High", "Medium", "Low"] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => {
                      setPriorityFilter(priority);
                      setPage(1);
                      setPriorityOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                      priorityFilter === priority ? "bg-[#f3f6fd] font-semibold text-[#1f3d8f]" : ""
                    }`}
                  >
                    {priority === "ALL" ? "All Priority" : priority}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead>
              <tr>
                {["TICKET ID", "USER / SERVICE PROVIDER", "TYPE", "SUBJECT", "STATUS", "ACTION"].map((head) => (
                  <th key={head} className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[12px] text-[#94a3b8]">
                    {tickets.length === 0 ? "No support tickets yet." : "No tickets match these filters."}
                  </td>
                </tr>
              )}
              {pagedTickets.map((ticket, index) => (
                <tr key={ticket.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[12px] font-semibold text-[#3b1e8a]">{ticket.id}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar ticket={ticket} size={28} />
                      <div>
                        <div className="text-[12px] font-semibold text-[#1f2d46]">{ticket.userName}</div>
                        <RoleBadge ticket={ticket} />
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[9px] text-[#64748b]">{ticket.type}</span>
                  </td>
                  <td className="max-w-[300px] overflow-hidden text-ellipsis border-b border-[#edf1fa] px-4 py-3 whitespace-nowrap text-[#1e293b]">
                    {ticket.subject}
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${ticketStatusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <button type="button" onClick={() => setSelectedTicketId(ticket.id)} className="text-[#294f99]" aria-label={`View ${ticket.id}`}>
                      <FiEye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-4 py-3 text-[10px] text-[#8b96ad]">
          <span>
            Showing {filteredTickets.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredTickets.length)} of {filteredTickets.length} results
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className={`grid h-6 w-6 place-items-center rounded border border-[#e6ecf7] text-[11px] ${
                page === 1 ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === 1}
            >
              <FiChevronLeft size={12} />
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
                    item === page ? "bg-[#3b1e8a] text-white" : "border border-[#e6ecf7] text-[#64748b]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className={`grid h-6 w-6 place-items-center rounded border border-[#e6ecf7] text-[11px] ${
                page === totalPages ? "text-[#94a3b8] opacity-60" : "text-[#64748b]"
              }`}
              aria-disabled={page === totalPages}
            >
              <FiChevronRight size={12} />
            </button>
          </div>
        </footer>
      </section>

      <div
        className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px] transition-opacity ${
          selectedTicket ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSelectedTicketId(null)}
        aria-hidden
      />

      {selectedTicket && (
        <div className="fixed inset-0 z-30 grid place-items-center p-4 md:p-6">
          <aside className="flex h-[min(92vh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[#e6ecf7] bg-[#fcfdff] shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <header className="border-b border-[#e6ecf7] bg-white px-5 py-4 md:px-7 md:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b96ad]">Support Ticket</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-[18px] font-semibold text-[#1d2a43]">{selectedTicket.subject}</h3>
                    {selectedTicket.priority === "High" && (
                      <span className="rounded-full bg-[#fee2e2] px-2.5 py-1 text-[10px] font-semibold text-[#dc2626]">High Priority</span>
                    )}
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${ticketStatusClass(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#70809d]">
                    <span className="font-semibold text-[#3b1e8a]">{selectedTicket.id}</span>
                    <span>Opened {formatDateTime(selectedTicket.openedAt)}</span>
                    <span>{selectedTicket.type}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e6ecf7] bg-[#f8faff] text-[18px] text-[#7c8aa5]"
                  aria-label="Close ticket details"
                >
                  x
                </button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
              <div className="max-h-[30vh] overflow-y-auto border-b border-[#e6ecf7] bg-white px-5 py-5 lg:max-h-none lg:border-b-0 lg:border-r lg:px-6">
                <div className="rounded-3xl border border-[#e6ecf7] bg-[#f8fbff] p-4">
                  <div className="flex items-center gap-3">
                    <Avatar ticket={selectedTicket} size={52} />
                    <div className="min-w-0">
                      <p className="m-0 text-[15px] font-semibold text-[#1d2a43]">{selectedTicket.userName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <RoleBadge ticket={selectedTicket} />
                        {selectedTicket.userEmail && <span className="truncate text-[11px] text-[#70809d]">{selectedTicket.userEmail}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                    <div className="rounded-2xl bg-white px-3 py-3">
                      <p className="m-0 text-[#8b96ad]">Status</p>
                      <p className="m-0 mt-1 font-semibold text-[#1d2a43]">{selectedTicket.status}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-3">
                      <p className="m-0 text-[#8b96ad]">Priority</p>
                      <p className="m-0 mt-1 font-semibold text-[#1d2a43]">{selectedTicket.priority}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-3">
                      <p className="m-0 text-[#8b96ad]">Type</p>
                      <p className="m-0 mt-1 font-semibold text-[#1d2a43]">{selectedTicket.type}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-3">
                      <p className="m-0 text-[#8b96ad]">Opened</p>
                      <p className="m-0 mt-1 font-semibold text-[#1d2a43]">{formatDateTime(selectedTicket.openedAt)}</p>
                    </div>
                  </div>
                </div>

                <section className="mt-5">
                  <h4 className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b96ad]">Issue Details</h4>
                  <p className="m-0 mt-3 rounded-3xl border border-[#e6ecf7] bg-white px-4 py-4 text-[13px] leading-6 text-[#475569]">
                    {selectedTicket.issueDetails}
                  </p>
                </section>
              </div>

              <div className="flex min-h-0 flex-col bg-[#fbfcff]">
                <section className="border-b border-[#e6ecf7] px-5 py-3 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h4 className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b96ad]">Conversation</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {(["Open", "In Progress", "Resolved"] as const).map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleStatusUpdate(statusOption)}
                          disabled={busy !== null}
                          className={`rounded-full px-3.5 py-2 text-[11px] font-semibold disabled:opacity-60 ${
                            selectedTicket.status === statusOption
                              ? "bg-[#1f3d8f] text-white"
                              : "border border-[#dbe2ef] bg-white text-[#64748b]"
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="min-h-0 flex-1 px-5 pt-4 md:px-6">
                  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e6ecf7] bg-white">
                    <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                      <div className="space-y-4">
                        {selectedTicket.conversation.map((message, i) => (
                          <div key={`${message.time}-${i}`} className={message.sender === "agent" ? "ml-auto max-w-[78%]" : "max-w-[78%]"}>
                            <div
                              className={`rounded-3xl px-4 py-3 text-[13px] leading-6 ${
                                message.sender === "agent"
                                  ? "rounded-tr-md bg-[#3b1e8a] text-white shadow-[0_12px_24px_rgba(59,30,138,0.18)]"
                                  : "rounded-tl-md border border-[#e6ecf7] bg-[#f8fbff] text-[#475569]"
                              }`}
                            >
                              {message.text}
                            </div>
                            <p className={`m-0 mt-2 text-[11px] text-[#8b96ad] ${message.sender === "agent" ? "text-right" : ""}`}>
                              {(message.name || (message.sender === "agent" ? "Support Agent" : selectedTicket.userName))} | {formatDateTime(message.time)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-3 md:px-6">
                  {actionError && (
                    <p className="m-0 mb-2 flex items-center gap-2 rounded-2xl border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-[12px] text-[#b91c1c]" role="alert">
                      <FiAlertCircle size={13} />
                      {actionError}
                    </p>
                  )}
                  <div className="flex items-end gap-2 rounded-3xl border border-[#dbe2ef] bg-white p-2 focus-within:border-[#3b1e8a]">
                    <textarea
                      placeholder="Type your reply here..."
                      aria-label="Reply"
                      rows={2}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="max-h-[140px] min-h-[52px] flex-1 resize-y border-0 bg-transparent px-2 py-1.5 text-[13px] leading-6 text-[#475569] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={busy !== null || !reply.trim()}
                      className="h-10 shrink-0 rounded-full bg-[#3b1e8a] px-5 text-[12px] font-semibold text-white disabled:opacity-60"
                    >
                      {busy === "reply" ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                  <p className="m-0 mt-1.5 pl-3 text-[10px] text-[#8b96ad]">Enter to send · Shift + Enter for a new line</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
