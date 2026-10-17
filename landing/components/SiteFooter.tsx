import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} Activity Planner. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link href="/terms" className="hover:text-brand-800">
            Terms of Service
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-brand-800">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
