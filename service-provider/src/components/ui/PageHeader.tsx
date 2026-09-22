import Link from "next/link";

export function PageHeader({ title, description, action, backHref }: { title: string; description?: string; action?: React.ReactNode; backHref?: string }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{backHref ? <Link href={backHref} className="text-xs font-bold text-sky-600 hover:underline">← Back</Link> : null}<h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">{title}</h1>{description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}</div>{action}</div>;
}
