"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiInbox,
  FiPaperclip,
  FiSearch,
  FiSliders,
  FiSmile
} from "react-icons/fi";
import { io, type Socket } from "socket.io-client";

type TicketStatus = "In Progress" | "Open" | "Resolved";
type TicketType = "Account" | "Technical" | "Billing" | "Compliance";
type Priority = "High" | "Medium" | "Low";

type ConversationMessage = {
  sender: "agent" | "user";
  text: string;
  time: string;
  name?: string;
};

type SupportTicket = {
  id: string;
  userName: string;
  userRole: "User" | "Vendor";
  avatar: string;
  type: TicketType;
  subject: string;
  status: TicketStatus;
  priority: Priority;
  openedAt: string;
  issueDetails: string;
  conversation: ConversationMessage[];
};

function safeImageSrc(value: string, fallbackSeed: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || `https://i.pravatar.cc/120?u=${encodeURIComponent(fallbackSeed)}`;
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

export function SupportDashboardView({
  data
}: {
  data: { summaryCards: Array<{ label: string; value: string; note: string; tone: string }>; tickets: SupportTicket[] };
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>(data.tickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | Priority>("ALL");
  const [page, setPage] = useState(1);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [reply, setReply] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

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
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

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

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const suffix = hours >= 12 ? "PM" : "AM";
    const normalized = hours % 12 || 12;
    return `${normalized}:${minutes} ${suffix}`;
  };

  const handleSendReply = () => {
    void (async () => {
      if (!selectedTicketId || !reply.trim()) return;
      const response = await fetch(`/api/support/${encodeURIComponent(selectedTicketId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim(), name: "Support Agent" })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        id?: string;
        conversation?: ConversationMessage[];
        status?: TicketStatus;
      };
      if (!response.ok) return;

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicketId
            ? {
                ...ticket,
                conversation: Array.isArray(payload.conversation) ? payload.conversation : ticket.conversation,
                status: payload.status ?? "In Progress"
              }
            : ticket
        )
      );
      setReply("");
    })();
  };

  const handleStatusUpdate = (nextStatus: TicketStatus) => {
    void (async () => {
      if (!selectedTicketId) return;
      const response = await fetch(`/api/support/${encodeURIComponent(selectedTicketId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        id?: string;
        conversation?: ConversationMessage[];
        status?: TicketStatus;
      };
      if (!response.ok) return;

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicketId
            ? {
                ...ticket,
                conversation: Array.isArray(payload.conversation) ? payload.conversation : ticket.conversation,
                status: payload.status ?? nextStatus
              }
            : ticket
        )
      );
    })();
  };

  useEffect(() => {
    const socket = io(socketUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("support:message", (payload: { ticketId?: string; sender?: "agent" | "user"; name?: string; message?: string; time?: string }) => {
      if (!payload?.ticketId || !payload?.message) return;
      const nextMessage: ConversationMessage = {
        sender: payload.sender ?? "user",
        text: payload.message,
        time: payload.time ?? formatTime(new Date()),
        name: payload.name
      };
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === payload.ticketId
            ? { ...ticket, conversation: [...ticket.conversation, nextMessage] }
            : ticket
        )
      );
    });

    return () => {
      socket.off("support:message");
      socket.disconnect();
    };
  }, [socketUrl]);

  return (
    <section className="relative space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {data.summaryCards.map((card, i) => (
          <article key={card.label} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className={`grid h-9 w-9 place-items-center rounded-full ${summaryIcon(i)}`}>
                {i === 0 && <FiInbox size={16} />}
                {i === 1 && <FiSliders size={16} />}
                {i === 2 && <FiCheck size={16} />}
                {i === 3 && <FiAlertCircle size={16} />}
              </div>
              <div>
                <p className="m-0 text-[10px] text-[#7d8ba6]">{card.label}</p>
                <h3 className="m-0 text-[20px] font-semibold text-[#1d2a43]">{card.value}</h3>
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
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStatusOpen((prev) => !prev);
                setPriorityOpen(false);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e6ecf7] bg-white px-3 text-[11px] text-[#3a4b70]"
            >
              All Statuses
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
              All Priority
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
                {["TICKET ID", "USER / VENDOR", "TYPE", "SUBJECT", "STATUS", "ACTION"].map((head) => (
                  <th key={head} className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.04em] text-[#7d8ba6]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedTickets.map((ticket, index) => (
                <tr key={ticket.id} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-3 text-[12px] font-semibold text-[#3b1e8a]">{ticket.id}</td>
                  <td className="border-b border-[#edf1fa] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Image src={safeImageSrc(ticket.avatar, ticket.id || ticket.userName)} alt={ticket.userName} width={28} height={28} className="h-7 w-7 rounded-full" />
                      <div>
                        <div className="text-[12px] font-semibold text-[#1f2d46]">{ticket.userName}</div>
                        <div className="text-[10px] text-[#8b96ad]">{ticket.userRole}</div>
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
          <aside className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[#e6ecf7] bg-[#fcfdff] shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
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

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="border-b border-[#e6ecf7] bg-white px-5 py-5 lg:border-b-0 lg:border-r lg:px-6">
                <div className="rounded-3xl border border-[#e6ecf7] bg-[#f8fbff] p-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={safeImageSrc(selectedTicket.avatar, selectedTicket.id || selectedTicket.userName)}
                      alt={selectedTicket.userName}
                      width={52}
                      height={52}
                      className="h-[52px] w-[52px] rounded-full"
                    />
                    <div>
                      <p className="m-0 text-[15px] font-semibold text-[#1d2a43]">{selectedTicket.userName}</p>
                      <p className="m-0 mt-1 text-[11px] text-[#70809d]">{selectedTicket.userRole}</p>
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
                <section className="border-b border-[#e6ecf7] px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b96ad]">Conversation</h4>
                      <p className="m-0 mt-1 text-[12px] text-[#70809d]">Review the full thread and respond from the same panel.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(["Open", "In Progress", "Resolved"] as const).map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleStatusUpdate(statusOption)}
                          className={`rounded-full px-3.5 py-2 text-[11px] font-semibold ${
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

                <div className="min-h-0 flex-1 px-5 py-5 md:px-6">
                  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e6ecf7] bg-white">
                    <div className="border-b border-[#eef2fb] px-4 py-3">
                      <p className="m-0 text-[11px] font-semibold text-[#5f6f8c]">Messages</p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
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
              </div>
            </div>

            <div className="border-t border-[#e6ecf7] bg-white px-5 py-4 md:px-6 md:py-5">
              <div className="relative">
                <textarea
                  placeholder="Type your reply here..."
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="min-h-[104px] w-full rounded-3xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-3 text-[13px] leading-6 text-[#475569] outline-none"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[#9aa6c0]">
                  <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-[#e6ecf7] bg-white">
                    <FiPaperclip size={12} />
                  </button>
                  <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-[#e6ecf7] bg-white">
                    <FiSmile size={12} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-[11px] text-[#8b96ad]">Press Enter to send quickly, or use Shift + Enter for a new line.</p>
                <button
                  type="button"
                  onClick={handleSendReply}
                  className="h-11 rounded-full bg-[#3b1e8a] px-6 text-[13px] font-semibold text-white sm:min-w-[220px]"
                >
                  Update Ticket & Send Reply
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
