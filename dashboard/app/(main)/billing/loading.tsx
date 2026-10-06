export default function Loading() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-3 w-80 animate-pulse rounded-full bg-[#edf2fb]" />
        <div className="h-8 w-40 animate-pulse rounded-full bg-[#edf2fb]" />
      </div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={`billing-card-skeleton-${index}`} className="rounded-2xl border border-[#e6ecf7] bg-white p-4 shadow-sm">
            <div className="mb-3 h-9 w-9 animate-pulse rounded-full bg-[#edf2fb]" />
            <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#f1f5f9]" />
            <div className="mt-2 h-6 w-28 animate-pulse rounded-full bg-[#edf2fb]" />
            <div className="mt-3 h-2.5 w-20 animate-pulse rounded-full bg-[#f1f5f9]" />
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-[#e6ecf7] bg-white p-4">
        <div className="h-4 w-36 animate-pulse rounded-full bg-[#e9eef8]" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-[#f1f5f9]" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`billing-rate-skeleton-${index}`} className="h-[118px] animate-pulse rounded-xl bg-[#f8fafc]" />
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        <div className="flex items-center justify-between border-b border-[#e6ecf7] px-4 py-3">
          <div className="h-4 w-40 animate-pulse rounded-full bg-[#e9eef8]" />
          <div className="h-8 w-64 animate-pulse rounded-full bg-[#f7f9fd]" />
        </div>
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`billing-row-skeleton-${index}`} className="flex items-center gap-4">
              <div className="h-7 w-7 animate-pulse rounded-full bg-[#edf2fb]" />
              <div className="h-3 flex-1 animate-pulse rounded-full bg-[#edf2fb]" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-[#f1f5f9]" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf2fb]" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-[#f3f6fd]" />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
