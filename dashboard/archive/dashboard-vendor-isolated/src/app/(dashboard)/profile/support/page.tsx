"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  date: string;
  status: "Resolved" | "In Progress" | "Open";
}

const TICKETS: Ticket[] = [
  {
    id: "#SP-2024-001",
    title: "Payment not processed",
    date: "Jan 15, 2026",
    status: "Resolved",
  },
  {
    id: "#SP-2024-002",
    title: "App crashes on booking",
    date: "Jan 18, 2026",
    status: "In Progress",
  },
  {
    id: "#SP-2024-003",
    title: "Promo code not working",
    date: "Jan 20, 2026",
    status: "Open",
  },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  });

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
          </div>

          {/* Tickets List */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 ml-2">
              My Support Tickets
            </h3>

            <div className="space-y-4">
              {TICKETS.map((ticket) => (
                <div
                  key={ticket.id}
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
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button className="w-full py-6 bg-[#1e2a5e] hover:bg-[#1a234d] text-white rounded-[28px] text-base font-black shadow-2xl shadow-[#1e2a5e]/30 transition-all flex items-center justify-center gap-3">
              Submit Support Request
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
