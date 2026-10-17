import Image from "next/image";
import Link from "next/link";
import { PROVIDER_PORTAL_URL } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-brand-800">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-lg" priority />
          <span className="text-xl tracking-tight">Activity Planner</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/#features" className="hidden hover:text-brand-800 sm:inline">
            Features
          </Link>
          <Link href="/#how-it-works" className="hidden hover:text-brand-800 sm:inline">
            How it works
          </Link>
          <a
            href={PROVIDER_PORTAL_URL}
            className="rounded-full bg-brand-800 px-4 py-2 text-white transition hover:bg-brand-900"
          >
            For providers
          </a>
        </nav>
      </div>
    </header>
  );
}
