import Link from "next/link";
import { Header } from "@/components/Header";
import { LegalContentEditorServer } from "@/components/legal-content/server";

type SearchParams = {
  tab?: string;
};

export default async function SettingsLegalContentPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialDocument = params?.tab === "privacy" ? "privacy" : "terms";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Legal Content" />

      <main className="flex-1 p-6 md:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800">Legal Content</h1>
              <p className="mt-1 text-sm text-slate-400">
                Edit terms and privacy copy for the service-provider portal.
              </p>
            </div>
            <Link
              href="/settings"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
            >
              Back to Settings
            </Link>
          </div>

          <LegalContentEditorServer initialDocument={initialDocument} />
        </div>
      </main>
    </div>
  );
}
