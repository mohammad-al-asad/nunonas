"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiClock, FiList, FiSave } from "react-icons/fi";

type DocumentKey = "terms" | "privacy";
type AudienceKey = "apps" | "business";

type LegalContentData = {
  title: string;
  lastUpdated: string;
  documents: Record<DocumentKey, string>;
  audiences: Record<AudienceKey, string>;
  content: Record<DocumentKey, Record<AudienceKey, string>>;
};

type SaveState = "saved" | "saving" | "error";

type PendingSave = {
  document: DocumentKey;
  audience: AudienceKey;
  content: string;
};

function updateDraftValue(
  draft: Record<DocumentKey, Record<AudienceKey, string>>,
  document: DocumentKey,
  audience: AudienceKey,
  content: string
) {
  return {
    ...draft,
    [document]: {
      ...draft[document],
      [audience]: content
    }
  };
}

export function LegalContentEditor({
  data,
  initialDocument
}: {
  data: LegalContentData;
  initialDocument: DocumentKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeDocument, setActiveDocument] = useState<DocumentKey>(initialDocument);
  const [activeAudience, setActiveAudience] = useState<AudienceKey>("apps");
  const [draft, setDraft] = useState(data.content);
  const [lastUpdated, setLastUpdated] = useState(data.lastUpdated);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);

  const saveContent = async (payload: PendingSave) => {
    setPendingSave(null);
    setSaveState("saving");

    const response = await fetch("/api/legal-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setSaveState("error");
      return;
    }

    const next = (await response.json()) as LegalContentData;
    setLastUpdated(next.lastUpdated);
    setSaveState("saved");
  };

  useEffect(() => {
    if (!pendingSave) return;

    const timeoutId = window.setTimeout(() => {
      void saveContent(pendingSave);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [pendingSave]);

  const currentValue = draft[activeDocument][activeAudience];

  const setCurrentValue = (value: string, autosave = true) => {
    setDraft((currentDraft) => updateDraftValue(currentDraft, activeDocument, activeAudience, value));
    if (autosave) {
      setPendingSave({
        document: activeDocument,
        audience: activeAudience,
        content: value
      });
    }
  };

  const handleDocumentChange = (document: DocumentKey) => {
    const params = new URLSearchParams();
    params.set("tab", document);
    setActiveDocument(document);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const applyInlineFormat = (prefix: string, suffix = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentValue.slice(start, end) || "text";
    const nextValue =
      currentValue.slice(0, start) + prefix + selectedText + suffix + currentValue.slice(end);

    setCurrentValue(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = currentValue.indexOf("\n", end);
    const sliceEnd = lineEnd === -1 ? currentValue.length : lineEnd;
    const selection = currentValue.slice(lineStart, sliceEnd);
    const nextSelection = selection
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const nextValue = currentValue.slice(0, lineStart) + nextSelection + currentValue.slice(sliceEnd);

    setCurrentValue(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + nextSelection.length);
    });
  };

  const saveBadge =
    saveState === "saving"
      ? { label: "Saving...", dot: "bg-[#2563eb]", tone: "text-[#24408d]" }
      : saveState === "error"
        ? { label: "Save failed", dot: "bg-[#ef4444]", tone: "text-[#b42318]" }
        : { label: "Draft saved", dot: "bg-[#22c55e]", tone: "text-[#3c485f]" };

  return (
    <section className="pb-6 pt-2">
      <div className="overflow-hidden rounded-[18px] border border-[#dde3ee] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e7ebf3] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="m-0 text-[18px] font-semibold text-[#252b37] sm:text-[20px]">{data.title}</h2>
            <p className="m-0 mt-1 text-[12px] text-[#6f7c92]">Last updated: {lastUpdated}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1.5 text-[#5f6b80]">
              <FiClock size={12} />
              Auto-save enabled
            </span>
            <span className={`inline-flex items-center gap-2 rounded-[8px] bg-[#f4f6fa] px-3 py-1.5 ${saveBadge.tone}`}>
              <span className={`h-2 w-2 rounded-full ${saveBadge.dot}`} />
              {saveBadge.label}
            </span>
          </div>
        </div>

        <div className="border-b border-[#e7ebf3] px-5">
          <div className="flex gap-8">
            {(["terms", "privacy"] as DocumentKey[]).map((document) => {
              const isActive = document === activeDocument;
              return (
                <button
                  key={document}
                  type="button"
                  onClick={() => handleDocumentChange(document)}
                  className={`border-b-2 px-3 py-3 text-[12px] font-medium transition ${
                    isActive
                      ? "border-[#24408d] text-[#234184]"
                      : "border-transparent text-[#66758c] hover:text-[#234184]"
                  }`}
                >
                  {data.documents[document]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#e7ebf3] px-5 py-4 sm:flex-row sm:items-center">
          <span className="text-[12px] text-[#4d5a71]">Editing for:</span>
          <div className="flex gap-3">
            {(["apps", "business"] as AudienceKey[]).map((audience) => {
              const isActive = audience === activeAudience;
              return (
                <button
                  key={audience}
                  type="button"
                  onClick={() => setActiveAudience(audience)}
                  className={`min-w-[64px] rounded-[6px] px-4 py-2 text-[12px] transition ${
                    isActive
                      ? "bg-[#24408d] text-white shadow-[0_8px_18px_rgba(36,64,141,0.18)]"
                      : "bg-[#f1f3f8] text-[#4a556b]"
                  }`}
                >
                  {data.audiences[audience]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-[#e7ebf3] px-5 py-4">
          <div className="flex flex-wrap items-center gap-1 text-[#66758c]">
            <button type="button" onClick={() => applyInlineFormat("**")} className="rounded px-2 py-1 text-[15px] font-semibold hover:bg-[#f3f6fb]">
              B
            </button>
            <button type="button" onClick={() => applyInlineFormat("*")} className="rounded px-2 py-1 text-[15px] italic hover:bg-[#f3f6fb]">
              I
            </button>
            <button type="button" onClick={() => applyInlineFormat("<u>", "</u>")} className="rounded px-2 py-1 text-[15px] underline hover:bg-[#f3f6fb]">
              U
            </button>
            <span className="mx-1 h-5 w-px bg-[#d9e0eb]" />
            <button type="button" onClick={() => applyLinePrefix("# ")} className="rounded px-2 py-1 text-[11px] font-semibold hover:bg-[#f3f6fb]">
              H1
            </button>
            <button type="button" onClick={() => applyLinePrefix("## ")} className="rounded px-2 py-1 text-[11px] font-semibold hover:bg-[#f3f6fb]">
              H2
            </button>
            <button type="button" onClick={() => applyLinePrefix("### ")} className="rounded px-2 py-1 text-[11px] font-semibold hover:bg-[#f3f6fb]">
              H3
            </button>
            <span className="mx-1 h-5 w-px bg-[#d9e0eb]" />
            <button type="button" onClick={() => applyLinePrefix("- ")} className="rounded px-2 py-1 hover:bg-[#f3f6fb]" aria-label="Bullet list">
              <FiList size={14} />
            </button>
            <button type="button" onClick={() => applyLinePrefix("1. ")} className="rounded px-2 py-1 text-[14px] hover:bg-[#f3f6fb]" aria-label="Numbered list">
              1.
            </button>
            <span className="mx-1 h-5 w-px bg-[#d9e0eb]" />
          </div>
        </div>

        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={currentValue}
            onChange={(event) => setCurrentValue(event.target.value)}
            className="min-h-[340px] w-full rounded-[10px] border border-[#dfe4ee] px-4 py-3 text-[14px] leading-7 text-[#2f3747] outline-none transition focus:border-[#24408d] focus:ring-1 focus:ring-[#24408d]"
          />
        </div>

        <div className="flex justify-end px-5 pb-5">
          <button
            type="button"
            onClick={() =>
              void saveContent({
                document: activeDocument,
                audience: activeAudience,
                content: draft[activeDocument][activeAudience]
              })
            }
            className="inline-flex min-w-[182px] items-center justify-center gap-2 rounded-[8px] bg-[#24408d] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(36,64,141,0.18)]"
          >
            <FiSave size={14} />
            Save
          </button>
        </div>
      </div>
    </section>
  );
}
