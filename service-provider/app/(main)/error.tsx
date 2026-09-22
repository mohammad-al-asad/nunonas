"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">This page could not be loaded</h2>
        <p className="mt-2 text-sm text-slate-500">Please check your connection and try again.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white">Try again</button>
      </div>
    </div>
  );
}
