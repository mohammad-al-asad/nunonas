export default function Loading() {
  return (
    <section className="space-y-4" aria-busy="true">
      <section className="rounded-2xl border border-[#e6ecf7] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-32 animate-pulse rounded-full bg-[#e9eef8]" />
            <div className="mt-2 h-3 w-72 animate-pulse rounded-full bg-[#f1f5f9]" />
          </div>
          <div className="h-8 w-28 animate-pulse rounded-xl bg-[#edf2fb]" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#f1f5f9]" />
              <div className="mt-2 h-10 animate-pulse rounded-xl bg-[#f8fafc]" />
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white">
        <div className="border-b border-[#e6ecf7] px-5 py-4">
          <div className="h-4 w-24 animate-pulse rounded-full bg-[#e9eef8]" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded-full bg-[#f1f5f9]" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-6 border-b border-[#eef2f7] px-5 py-4 last:border-0">
            <div className="h-3.5 w-40 animate-pulse rounded-full bg-[#edf2fb]" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#f1f5f9]" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#f1f5f9]" />
            <div className="ml-auto h-7 w-36 animate-pulse rounded-lg bg-[#f1f5f9]" />
          </div>
        ))}
      </section>
    </section>
  );
}
