"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  vendorCreateSupportTicket,
  vendorListSupportTickets,
} from "@/lib/vendor-api";

interface Ticket {
  id: string;
  title: string;
  date: string;
  status: "Resolved" | "In Progress" | "Open";
}

function normalizeStatus(value: unknown): Ticket["status"] {
  const status = String(value ?? "open").toLowerCase();
  if (status.includes("resolv") || status === "closed") return "Resolved";
  if (status.includes("progress") || status === "pending") return "In Progress";
  return "Open";
}

function normalizeTickets(payload: Record<string, unknown>): Ticket[] {
  const rows = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.tickets)
      ? payload.tickets
      : [];
  return rows.map((row, index) => {
    const ticket = (row ?? {}) as Record<string, unknown>;
    return {
      id: String(ticket.id ?? ticket.ticket_id ?? `#SP-${index + 1}`),
      title: String(ticket.subject ?? ticket.title ?? "Support request"),
      date: String(ticket.created_at ?? ticket.date ?? "").slice(0, 10),
      status: normalizeStatus(ticket.status),
    };
  });
}

export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  React.useEffect(() => {
    void vendorListSupportTickets({ limit: 50, skip: 0 })
      .then((payload) => setTickets(normalizeTickets(payload)))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Failed to load support tickets."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (formData.subject.trim().length < 3 || formData.description.trim().length < 10) {
      setMessage("Enter a subject and at least 10 characters describing the issue.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await vendorCreateSupportTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });
      setFormData({ subject: "", description: "" });
      const payload = await vendorListSupportTickets({ limit: 50, skip: 0 });
      setTickets(normalizeTickets(payload));
      setMessage("Support request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Support & Help" />

      <main className="flex-1 p-6 md:p-10 pb-32">
        <div className="max-w-[800px] mx-auto space-y-12">
          {/* Back Button */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-[#1e2a5e] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Link>

          {/* Form Card */}
          <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-100 space-y-10">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
              Submit Support Request
            </h2>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">
                  Description
                </label>
                <textarea
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-bold text-slate-500 leading-relaxed resize-none"
                />
              </div>
            </div>
            {message ? <p className="text-sm font-bold text-[#1e2a5e]">{message}</p> : null}
          </div>

          {/* Tickets List */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 ml-2">
              My Support Tickets
            </h3>

            <div className="space-y-4">
              {loading ? <p className="text-sm font-bold text-slate-400">Loading tickets...</p> : null}
              {!loading && tickets.length === 0 ? <p className="text-sm font-bold text-slate-400">No support tickets yet.</p> : null}
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/profile/support/${encodeURIComponent(ticket.id)}`}
                  className="bg-white p-8 rounded-[32px] border border-slate-100 hover:border-sky-200 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-800">
                      {ticket.id}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-black px-4 py-1.5 rounded-full transition-colors",
                        ticket.status === "Resolved" &&
                          "bg-emerald-50 text-emerald-600",
                        ticket.status === "In Progress" &&
                          "bg-amber-50 text-amber-600",
                        ticket.status === "Open" && "bg-sky-50 text-sky-600",
                      )}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-500">
                      {ticket.title}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">
                      {ticket.date}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-6 bg-[#1e2a5e] hover:bg-[#1a234d] disabled:opacity-60 text-white rounded-[28px] text-base font-black shadow-2xl shadow-[#1e2a5e]/30 transition-all flex items-center justify-center gap-3"
            >
              {submitting ? "Submitting..." : "Submit Support Request"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
