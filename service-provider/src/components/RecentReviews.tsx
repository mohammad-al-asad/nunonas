"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { vendorReplyReview } from "@/lib/vendor-api";
import { vendorQueryKeys } from "@/lib/vendor-queries";

export interface RecentReview {
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
  vendor_reply?: string | null;
}

export function RecentReviews({ reviews = [] }: { reviews?: RecentReview[] }) {
  const queryClient = useQueryClient();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => vendorReplyReview(id, text),
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ queryKey: vendorQueryKeys.dashboardOverview });
      const previous = queryClient.getQueryData(vendorQueryKeys.dashboardOverview);
      queryClient.setQueryData(vendorQueryKeys.dashboardOverview, (current: unknown) => {
        if (!current || typeof current !== "object") return current;
        const overview = current as { recent_reviews?: RecentReview[] };
        return {
          ...overview,
          recent_reviews: overview.recent_reviews?.map((review) =>
            (review.id ?? review._id) === id ? { ...review, vendor_reply: text } : review,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(vendorQueryKeys.dashboardOverview, context.previous);
    },
    onSuccess: async () => {
      setReplyingId(null);
      setReplyText("");
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.dashboardOverview });
    },
  });

  return (
    <section aria-labelledby="recent-reviews-title" className="h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-8 flex items-center justify-between">
        <h3 id="recent-reviews-title" className="text-sm font-bold text-slate-800">Recent Reviews</h3>
        <Link href="/reviews" className="text-sm font-semibold text-sky-500 transition-colors hover:text-sky-600">View All</Link>
      </div>
      {reviews.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No reviews yet</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => {
            const reviewId = review.id ?? review._id ?? String(index);
            const rating = review.star_rating ?? review.rating ?? 0;
            const name = review.customer_name ?? review.customer ?? "Customer";
            const text = review.review_text ?? review.text ?? "";
            return (
              <article key={reviewId} className="rounded-xl bg-slate-50/50 p-4">
                <div className="mb-2 flex items-center">
                  {review.avatar_url ? <Image src={review.avatar_url} alt="" width={32} height={32} sizes="32px" className="mr-3 h-8 w-8 rounded-full object-cover" /> : <div aria-hidden="true" className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600">{name.charAt(0).toUpperCase()}</div>}
                  <div><h4 className="text-xs font-bold text-slate-800">{name}</h4><div className="flex" aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, star) => <Star aria-hidden="true" key={star} className={`h-3 w-3 ${star < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div></div>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-500">{text}</p>
                {review.vendor_reply ?? review.reply ? (
                  <p className="text-xs italic text-sky-600">Your reply: {review.vendor_reply ?? review.reply}</p>
                ) : replyingId === reviewId ? (
                  <div className="mt-2 space-y-2">
                    <label htmlFor={`reply-${reviewId}`} className="sr-only">Reply to {name}</label>
                    <input id={`reply-${reviewId}`} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-400" placeholder="Write a reply…" value={replyText} onChange={(event) => setReplyText(event.target.value)} />
                    {replyMutation.isError ? <p className="text-xs text-red-600">Reply could not be sent. Please try again.</p> : null}
                    <div className="flex gap-2"><button type="button" disabled={!replyText.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate({ id: reviewId, text: replyText.trim() })} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{replyMutation.isPending ? "Sending…" : "Send"}</button><button type="button" onClick={() => { setReplyingId(null); setReplyText(""); }} className="px-2 text-xs text-slate-500">Cancel</button></div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setReplyingId(reviewId)} className="text-xs font-bold text-sky-500 hover:underline">Reply</button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
