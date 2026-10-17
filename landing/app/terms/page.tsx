import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getLegalDocument } from "@/lib/legal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Activity Planner app and website.",
};

export default async function TermsPage() {
  const terms = await getLegalDocument("terms");

  if (!terms) {
    return (
      <article className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-6 text-slate-600">We couldn&apos;t load the terms right now. Please try again in a few minutes.</p>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight">{terms.title}</h1>
      {terms.lastUpdated && <p className="mt-3 text-sm text-slate-500">Last updated: {terms.lastUpdated}</p>}
      <div className="mt-10">
        {/* The editor content usually starts with its own "# Terms of Service" heading. */}
        <Markdown source={terms.content} skipFirstHeading />
      </div>
    </article>
  );
}
