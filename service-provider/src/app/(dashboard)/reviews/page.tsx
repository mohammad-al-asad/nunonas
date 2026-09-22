"use client";

import React, { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import {
  Star,
  Search,
  ChevronDown,
  Reply,
  Undo2,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorListReviews, vendorReplyReview } from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

interface Review {
  id: string;
  customer_name?: string;
  avatar_url?: string;
  customer_avatar?: string;
  star_rating?: number;
  rating?: number;
  provider_type?: string;
  review_text?: string;
  created_at?: string;
  vendor_reply?: string | null;
  replied_at?: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "replied" | "unreplied">("all");
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [serviceFilter, setServiceFilter] = useState<"all" | "restaurant" | "hotel" | "spa" | "event">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const reviewParams = {
    limit: ITEMS_PER_PAGE,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    search: search || undefined,
    star_rating: starFilter ?? undefined,
    replied: activeTab === "all" ? undefined : activeTab === "replied",
    provider_type: serviceFilter === "all" ? undefined : serviceFilter,
  };
  const reviewsKey = vendorQueryKeys.reviews(reviewParams);
  const reviewsQuery = useQuery({
    queryKey: reviewsKey,
    queryFn: ({ signal }) => vendorListReviews(reviewParams, signal) as Promise<{ items?: Review[]; total?: number }>,
    placeholderData: keepPreviousData,
  });
  const reviews = reviewsQuery.data?.items ?? [];
  const total = reviewsQuery.data?.total ?? 0;
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: string; text: string }) => vendorReplyReview(reviewId, text),
    onMutate: async ({ reviewId, text }) => {
      await queryClient.cancelQueries({ queryKey: reviewsKey });
      const previous = queryClient.getQueryData(reviewsKey);
      queryClient.setQueryData<{ items?: Review[]; total?: number }>(reviewsKey, (current) => current ? {
        ...current,
        items: current.items?.map((review) => review.id === reviewId ? { ...review, vendor_reply: text } : review),
      } : current);
      return { previous };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(reviewsKey, context?.previous),
    onSuccess: async () => {
      setReplyingTo(null);
      setReplyText("");
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.reviews() });
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.dashboardOverview });
    },
  });

  const handleReply = (reviewId: string) => {
    if (replyText.trim()) replyMutation.mutate({ reviewId, text: replyText.trim() });
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const unrepliedCount = reviews.filter((r) => !r.vendor_reply).length;

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-10">
      <Header title="Reviews" />

      <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          {/* Search & Tabs */}
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by customer name or keywords..."
                className="w-full bg-slate-50 border border-slate-50 rounded-2xl py-3 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 pr-12 text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100/50 transition-colors"
                value={serviceFilter}
                onChange={(e) => {
                  setServiceFilter(e.target.value as typeof serviceFilter);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Service: All</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="spa">Spa</option>
                <option value="event">Event</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 pr-12 text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100/50 transition-colors"
                value={starFilter ?? ""}
                onChange={(e) => { setStarFilter(e.target.value ? Number(e.target.value) : null); setCurrentPage(1); }}
              >
                <option value="">Star Rating: All</option>
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} Stars</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl">
              {(["all", "replied", "unreplied"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-bold transition-all capitalize",
                    activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  {tab}
                  {tab === "unreplied" && unrepliedCount > 0 && (
                    <span className="ml-1 text-[10px] h-4 w-4 bg-rose-500 text-white rounded-full inline-flex items-center justify-center">
                      ●
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Review Feed */}
          <div className="space-y-8 pb-10">
            {reviewsQuery.isPending ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviewsQuery.isError ? (
              <div className="py-16 text-center text-red-600">Reviews could not be loaded. <button type="button" onClick={() => reviewsQuery.refetch()} className="font-bold underline">Try again</button></div>
            ) : reviews.length === 0 ? (
              <div className="text-center text-slate-400 py-16">No reviews found.</div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-md"
                >
                  <div className="flex gap-5 sm:gap-8">
                    <div className="h-12 w-12 rounded-2xl overflow-hidden shrink-0 ring-4 ring-slate-50/50 sm:h-16 sm:w-16 sm:rounded-3xl sm:ring-8">
                      {review.avatar_url ?? review.customer_avatar ? (
                        <img src={review.avatar_url ?? review.customer_avatar} alt={review.customer_name ?? "Customer"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-sky-100 flex items-center justify-center text-sky-600 text-xl font-bold">
                          {(review.customer_name ?? "C").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-bold text-slate-800">
                            {review.customer_name ?? "Customer"}
                          </h4>
                        </div>
                        {review.created_at && (
                          <span className="text-xs font-bold text-slate-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn("h-4 w-4", s <= (review.star_rating ?? review.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-200")}
                          />
                        ))}
                      </div>

                      <span className="mb-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {review.provider_type === "hotel_room" ? "Hotel" : review.provider_type || "Service"}
                      </span>

                      <p className="text-base text-slate-600 leading-relaxed mb-8">
                        {review.review_text ?? ""}
                      </p>

                      {review.vendor_reply ? (
                        <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5 sm:p-8">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-2">
                              <Undo2 className="h-3 w-3" />
                              BUSINESS RESPONSE
                            </p>
                            {review.replied_at && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(review.replied_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 italic leading-relaxed">“{review.vendor_reply}”</p>
                        </div>
                      ) : replyingTo === review.id ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <textarea
                            rows={6}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your business response here..."
                            className="w-full bg-white border border-slate-200 rounded-3xl p-8 text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/5 transition-all resize-none shadow-inner"
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={replyMutation.isPending || !replyText.trim()}
                              onClick={() => handleReply(review.id)}
                              className="bg-[#1e2a5e] hover:bg-[#1a2552] text-white px-8 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                            >
                              {replyMutation.isPending ? "Sending…" : "Send Response"} <Send className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#1e2a5e] hover:bg-[#1a2552] text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-slate-900/10"
                        >
                          <Reply className="h-3 w-3" />
                          Reply to Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between pb-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing{" "}
                <span className="text-slate-800">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)}
                </span>{" "}
                of {total} reviews
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all",
                      currentPage === page
                        ? "bg-[#1e2a5e] text-white shadow-lg shadow-slate-900/10"
                        : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50",
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
