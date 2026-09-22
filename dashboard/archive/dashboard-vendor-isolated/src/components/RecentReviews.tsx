"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { vendorGetRecentReviews, vendorReplyReview } from "@/lib/vendor-api";

interface Review {
  id?: string;
  _id?: string;
  customer_name?: string;
  customer?: string;
  avatar_url?: string;
  star_rating?: number;
  rating?: number;
  review_text?: string;
  text?: string;
  reply?: string | null;
}

export function RecentReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    vendorGetRecentReviews(5)
      .then((data) => {
        const raw = data as { items?: Review[]; reviews?: Review[] };
        setReviews(raw?.items ?? raw?.reviews ?? []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await vendorReplyReview(reviewId, replyText.trim());
      setReviews((prev) =>
        prev.map((r) =>
          (r.id ?? r._id) === reviewId ? { ...r, reply: replyText.trim() } : r,
        ),
      );
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      console.warn("Failed to reply:", err);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-bold text-slate-800">Recent Reviews</h3>
        <button className="text-sm font-semibold text-sky-500 hover:text-sky-600 transition-colors">
          View All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-slate-400 py-10 text-sm">No reviews yet</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => {
            const reviewId = review.id ?? review._id ?? String(idx);
            const rating = review.star_rating ?? review.rating ?? 5;
            const name = review.customer_name ?? review.customer ?? "Customer";
            const text = review.review_text ?? review.text ?? "";
            return (
              <div key={reviewId} className="p-4 rounded-xl bg-slate-50/50">
                <div className="flex items-center mb-2">
                  {review.avatar_url ? (
                    <img
                      src={review.avatar_url}
                      alt={name}
                      className="h-8 w-8 rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full mr-3 bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{name}</h4>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{text}</p>

                {review.reply ? (
                  <p className="text-xs text-sky-600 italic">Your reply: {review.reply}</p>
                ) : replyingId === reviewId ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-sky-400"
                      placeholder="Write a reply…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      onClick={() => handleReply(reviewId)}
                      className="text-xs font-bold text-white bg-sky-500 px-3 py-1 rounded-lg"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => { setReplyingId(null); setReplyText(""); }}
                      className="text-xs text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingId(reviewId)}
                    className="text-[10px] font-bold text-sky-500 hover:underline"
                  >
                    Reply
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
