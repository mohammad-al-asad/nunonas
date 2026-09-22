"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Header } from "@/components/Header";
import { vendorGetLegalDoc } from "@/lib/vendor-api";

type LegalDocumentPayload = {
  doc_type?: string;
  title?: string;
  content?: string;
  audience?: string;
  last_updated?: string;
};

function normalizeDocType(value: string) {
  return value === "privacy" ? "privacy" : "terms";
}

function renderContent(value: string) {
  return value.replace(/^#+\s?/gm, "").replace(/[*_`]/g, "").trim();
}

export default function VendorLegalDocumentPage({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const [docType, setDocType] = useState<"terms" | "privacy">("terms");
  const [document, setDocument] = useState<LegalDocumentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      const resolved = await params;
      const normalizedDocType = normalizeDocType(resolved.docType) as "terms" | "privacy";
      if (!active) return;
      setDocType(normalizedDocType);
      setLoading(true);
      setError("");

      try {
        const payload = await vendorGetLegalDoc(normalizedDocType);
        if (active) {
          setDocument(payload as LegalDocumentPayload);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load legal document.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDocument();
    return () => {
      active = false;
    };
  }, [params]);

  const title = useMemo(() => {
    if (document?.title) return document.title;
    return docType === "privacy" ? "Privacy Policy" : "Terms & Conditions";
  }, [document, docType]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title={title} />

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          <div className="mt-6 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            {loading ? (
              <p className="text-sm font-bold text-slate-400">Loading document...</p>
            ) : error ? (
              <p className="text-sm font-bold text-rose-600">{error}</p>
            ) : (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Business Legal Content
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-800">
                  {title}
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-400">
                  Last updated: {document?.last_updated || "Not available"}
                </p>

                <div className="mt-8 rounded-[24px] bg-slate-50/70 p-6">
                  <div className="whitespace-pre-wrap text-sm font-bold leading-8 text-slate-600">
                    {renderContent(document?.content || "")}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
