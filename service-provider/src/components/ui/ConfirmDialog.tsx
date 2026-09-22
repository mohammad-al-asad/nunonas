"use client";

import { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} disabled={busy} />
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button ref={closeRef} type="button" aria-label="Close dialog" onClick={onClose} disabled={busy} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        <AlertTriangle aria-hidden="true" className={`h-8 w-8 ${destructive ? "text-rose-500" : "text-amber-500"}`} />
        <h2 id={titleId} className="mt-4 text-xl font-black text-slate-800">{title}</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className={`rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50 ${destructive ? "bg-rose-500 hover:bg-rose-600" : "bg-[#1e2a5e] hover:bg-[#17204b]"}`}>{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
