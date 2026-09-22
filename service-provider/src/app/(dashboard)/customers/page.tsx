"use client";

import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarDays, Eye, Search, Users, X } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { vendorListUsers } from "@/lib/vendor-api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type Customer = { id: string; full_name?: string; email?: string; phone?: string; latest_booking_at?: string };
const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(query.trim());
  const customersQuery = useQuery({
    queryKey: ["vendor", "customers", page, search],
    queryFn: () => vendorListUsers({ limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, search: search || undefined }),
    placeholderData: keepPreviousData,
  });
  const payload = customersQuery.data as { users?: Customer[]; total?: number } | undefined;
  const customers = payload?.users ?? [];
  const total = payload?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <Header title="Customers" />
      <main className="w-full space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total customers</p><p className="mt-1 flex items-center gap-2 text-xl font-black text-slate-800"><Users className="h-4 w-4 text-sky-500" />{total}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Showing</p><p className="mt-1 flex items-center gap-2 text-xl font-black text-slate-800"><CalendarDays className="h-4 w-4 text-emerald-500" />{firstItem}-{lastItem}</p></div>
          </div>
        </div>
        <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search customers" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by name, email, or phone" className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-12 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50" />{query ? <button type="button" aria-label="Clear customer search" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button> : null}</div>
        {customersQuery.isFetching && !customersQuery.isPending ? <p className="text-right text-xs font-bold text-sky-600">Updating results…</p> : null}
        <section aria-label="Customer list" className="overflow-hidden rounded-3xl border border-slate-200 bg-white pl-4 shadow-sm sm:pl-6">
          {customersQuery.isPending ? <div className="h-56 animate-pulse bg-slate-50" /> : customersQuery.isError ? <div className="p-12 text-center"><p className="text-sm font-bold text-red-600">Customers could not be loaded.</p><button type="button" onClick={() => customersQuery.refetch()} className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">Try again</button></div> : customers.length === 0 ? <div className="p-14 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">{search ? "No customers match your search." : "No customers found yet."}</p><p className="mt-1 text-xs text-slate-400">Customer records appear after a booking or interaction.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-100 bg-slate-50/70"><tr><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Customer</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Contact</th><th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Latest booking</th><th className="px-6 py-4 text-right"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-100">{customers.map((customer) => <tr key={customer.id} className="transition hover:bg-sky-50/40"><td className="px-6 py-5"><p className="font-black text-slate-800">{customer.full_name || "Customer"}</p><p className="mt-1 text-xs text-slate-400">ID: {customer.id}</p></td><td className="px-6 py-5 text-sm text-slate-600"><p>{customer.email || "No email provided"}</p><p className="mt-1 text-xs text-slate-400">{customer.phone || "No phone provided"}</p></td><td className="px-6 py-5 text-sm text-slate-500">{customer.latest_booking_at ? new Date(customer.latest_booking_at).toLocaleDateString() : "No booking yet"}</td><td className="px-6 py-5 text-right"><Link prefetch={false} href={`/customers/${encodeURIComponent(customer.id)}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-sky-50 hover:text-sky-600"><Eye className="h-4 w-4" /> View details</Link></td></tr>)}</tbody></table></div>}
        </section>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={PAGE_SIZE} itemLabel="customers" onPageChange={setPage} />
      </main>
    </div>
  );
}
