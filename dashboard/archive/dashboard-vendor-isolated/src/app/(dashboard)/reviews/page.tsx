"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import {
  Star,
  Search,
  ChevronDown,
  Reply,
  CheckCircle2,
  Undo2,
  Send,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEWS_DATA = [
  {
    id: 1,
    user: "James L.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    rating: 5,
    isVerified: true,
    date: "Oct 12, 2023 • 2:14 PM",
    comment:
      "Excellent service and the room was spotless! The staff went above and beyond to make our anniversary special. The rooftop bar has the best views of the city skyline. Will definitely be coming back next year.",
    response: null,
  },
  {
    id: 2,
    user: "Sarah M.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 4,
    isVerified: true,
    date: "Oct 10, 2023 • 10:45 AM",
    comment:
      "Loved the breakfast buffet! Only downside was the Wi-Fi in the room was a bit spotty at times. Otherwise, a great stay.",
    response: {
      date: "Oct 11, 2023",
      text: "Dear Sarah, thank you for your feedback! We're glad you enjoyed the breakfast. We are currently upgrading our router systems to ensure better coverage in all rooms. Hope to see you again!",
    },
  },
  {
    id: 3,
    user: "Marcus T.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    rating: 3,
    isVerified: true,
    date: "Oct 08, 2023 • 5:30 PM",
    comment:
      "The check-in process was a bit slow, waited for about 30 minutes in the lobby. The room was nice but expected more for the price.",
    response: null,
  },
];

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "replied" | "unreplied">(
    "all",
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Reviews" />

      <main className="flex-1 p-6 md:p-10 space-y-10">
        <div className="max-w-[1200px] mx-auto space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Review Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Track and respond to your customer feedback across platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Rating Overview */}
            <div className="lg:col-span-4 bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col justify-center">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  RATING OVERVIEW
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-slate-800">
                    4.8
                  </span>
                  <span className="text-xl font-bold text-slate-300">
                    / 5.0
                  </span>
                </div>
                <div className="flex gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="text-[10px] font-black text-emerald-500 ml-4 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    +0.2
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-8">
                  Based on 2,450 verified reviews
                </p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="lg:col-span-8 bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
                RATING BREAKDOWN
              </p>
              <div className="space-y-4">
                {[
                  { s: 5, p: 75 },
                  { s: 4, p: 15 },
                  { s: 3, p: 6 },
                  { s: 2, p: 3 },
                  { s: 1, p: 1 },
                ].map((r) => (
                  <div key={r.s} className="flex items-center gap-6 group">
                    <span className="text-xs font-bold text-slate-400 w-10">
                      {r.s} Star
                    </span>
                    <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1e2a5e] rounded-full transition-all duration-1000"
                        style={{ width: `${r.p}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-10 text-right">
                      {r.p}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-50 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name or keywords..."
                className="w-full bg-slate-50 border border-slate-50 rounded-2xl py-3 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>

            <div className="relative">
              <select className="appearance-none bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 pr-12 text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100/50 transition-colors">
                <option>Star Rating: All</option>
                <option>5 Stars</option>
                <option>4 Stars</option>
                <option>3 Stars</option>
                <option>2 Stars</option>
                <option>1 Star</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                  activeTab === "all"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("replied")}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                  activeTab === "replied"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                Replied
              </button>
              <button
                onClick={() => setActiveTab("unreplied")}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                  activeTab === "unreplied"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                Unreplied{" "}
                <span className="ml-1 text-[10px] h-4 w-4 bg-rose-500 text-white rounded-full inline-flex items-center justify-center">
                  ●
                </span>
              </button>
            </div>
          </div>

          {/* Review Feed */}
          <div className="space-y-8 pb-10">
            {REVIEWS_DATA.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-md"
              >
                <div className="flex gap-8">
                  <div className="h-16 w-16 rounded-3xl overflow-hidden shrink-0 ring-8 ring-slate-50/50 ring-offset-0">
                    <img
                      src={review.avatar}
                      alt={review.user}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-bold text-slate-800">
                          {review.user}
                        </h4>
                        {review.isVerified && (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg uppercase tracking-wider">
                            VERIFIED BOOKING
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {review.date}
                      </span>
                    </div>

                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200",
                          )}
                        />
                      ))}
                    </div>

                    <p className="text-base text-slate-600 leading-relaxed mb-8">
                      {review.comment}
                    </p>

                    {review.response ? (
                      <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 relative group/response">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-2">
                              <Undo2 className="h-3 w-3" />
                              BUSINESS RESPONSE
                            </p>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {review.response.date}
                          </p>
                        </div>
                        <p className="text-sm text-slate-500 italic leading-relaxed">
                          "{review.response.text}"
                        </p>
                        <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover/response:opacity-100 transition-opacity">
                          <button className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-500 transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : replyingTo === review.id ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <textarea
                          rows={6}
                          placeholder="Write your business response here..."
                          className="w-full bg-white border border-slate-200 rounded-3xl p-8 text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/5 transition-all resize-none shadow-inner"
                        />
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
                          >
                            Cancel
                          </button>
                          <button className="bg-[#1e2a5e] hover:bg-[#1a2552] text-white px-8 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10">
                            Send Response
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#1e2a5e] hover:bg-[#1a2552] text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                      >
                        <Reply className="h-3 w-3" />
                        Reply to Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pb-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-800">1-3</span> of 2,450
              reviews
            </p>
            <div className="flex gap-2">
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#1e2a5e] text-white text-xs font-bold shadow-lg shadow-slate-900/10 transition-all">
                1
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 text-xs font-bold hover:bg-slate-50 transition-all">
                2
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 text-xs font-bold hover:bg-slate-50 transition-all">
                3
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
