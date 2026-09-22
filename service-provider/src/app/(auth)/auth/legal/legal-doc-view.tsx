"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { vendorGetPublicLegalDoc } from "@/lib/vendor-api";

type LegalDocViewProps = {
  docType: "terms" | "privacy";
};

type LegalDocState = {
  title: string;
  content: string;
  last_updated: string;
};

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function LegalDocView({ docType }: LegalDocViewProps) {
  const [data, setData] = useState<LegalDocState>({
    title: docType === "privacy" ? "Privacy Policy" : "Terms of Service",
    content: "",
    last_updated: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDoc() {
      setLoading(true);
      setError("");

      try {
        const response = await vendorGetPublicLegalDoc(docType);
        if (!mounted) {
          return;
        }
        setData({
          title: asText(response.title, docType === "privacy" ? "Privacy Policy" : "Terms of Service"),
          content: asText(response.content),
          last_updated: asText(response.last_updated),
        });
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load legal document.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDoc();
    return () => {
      mounted = false;
    };
  }, [docType]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/auth/register"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#1e2a5e] transition hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to registration
        </Link>

        <section className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
          <div className="border-b border-slate-100 px-8 py-7">
            <h1 className="text-3xl font-black text-slate-800">{data.title}</h1>
            {data.last_updated ? (
              <p className="mt-2 text-sm font-semibold text-slate-400">
                Last updated: {data.last_updated}
              </p>
            ) : null}
          </div>

          <div className="px-8 py-8">
            {loading ? (
              <p className="text-sm font-bold text-slate-500">Loading document...</p>
            ) : error ? (
              <p className="text-sm font-bold text-[#b24d30]">{error}</p>
            ) : (
              <article className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {data.content || "No content available."}
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
