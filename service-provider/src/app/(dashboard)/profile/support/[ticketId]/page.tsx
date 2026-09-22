"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Header } from "@/components/Header";
import {
  vendorGetSupportTicket,
  vendorReplySupportTicket,
} from "@/lib/vendor-api";

type TicketMessage = {
  sender?: string;
  message?: string;
  sent_at?: string;
};

export default function SupportTicketPage({
}) {
  const params = useParams<{ ticketId: string }>();
  const ticketId = decodeURIComponent(String(params.ticketId ?? ""));
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadTicket = async () => {
    try {
      setTicket(await vendorGetSupportTicket(ticketId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTicket();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [ticketId]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      await vendorReplySupportTicket(ticketId, reply.trim());
      setReply("");
      await loadTicket();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const messages = Array.isArray(ticket?.messages) ? ticket.messages as TicketMessage[] : [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header title="Support Ticket" />
      <main className="mx-auto max-w-[900px] space-y-6 p-6 md:p-10">
        <Link href="/profile/support" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1e2a5e]">
          <ArrowLeft className="h-4 w-4" /> Back to Support
        </Link>
        {loading ? <p className="font-bold text-slate-400">Loading ticket...</p> : null}
        {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
        {ticket ? (
          <>
            <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{String(ticket.ticket_code ?? ticket.id ?? ticketId)}</p>
                  <h1 className="mt-2 text-2xl font-black text-slate-800">{String(ticket.subject ?? "Support request")}</h1>
                </div>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-xs font-black uppercase text-sky-600">{String(ticket.status ?? "open")}</span>
              </div>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">{String(ticket.description ?? "")}</p>
            </section>
            <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-800">Conversation</h2>
              {messages.length === 0 ? <p className="text-sm text-slate-400">No replies yet.</p> : messages.map((item, index) => (
                <div key={`${item.sent_at ?? "message"}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{item.sender ?? "Support"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message ?? ""}</p>
                </div>
              ))}
              <div className="flex gap-3 pt-3">
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Write a reply..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-500" />
                <button type="button" onClick={sendReply} disabled={sending || !reply.trim()} className="self-end rounded-2xl bg-[#1e2a5e] px-5 py-4 text-sm font-black text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
