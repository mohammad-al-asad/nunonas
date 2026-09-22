export function VendorDetailSkeleton() {
  return (
    <section className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded-full bg-[#edf2fb]" />
          <div className="h-8 w-64 animate-pulse rounded-full bg-[#e9eef8]" />
          <div className="h-3 w-80 animate-pulse rounded-full bg-[#f1f5f9]" />
        </div>
        <div className="h-10 w-20 animate-pulse rounded-xl border border-[#dbe2ef] bg-white" />
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#e6ecf7] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="h-28 w-28 animate-pulse rounded-3xl bg-[#edf2fb]" />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-7 w-56 animate-pulse rounded-full bg-[#e9eef8]" />
                <div className="h-4 w-32 animate-pulse rounded-full bg-[#f1f5f9]" />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-[#eef2ff]" />
                <div className="h-7 w-32 animate-pulse rounded-full bg-[#f8fafc]" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-[#fff4cc]" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-4 w-40 animate-pulse rounded-full bg-[#edf2fb]" />
                <div className="h-4 w-32 animate-pulse rounded-full bg-[#edf2fb]" />
                <div className="h-4 w-72 animate-pulse rounded-full bg-[#f1f5f9] sm:col-span-2" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[330px]">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={`vendor-hero-stat-${index}`} className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="h-3 w-20 animate-pulse rounded-full bg-[#edf2fb]" />
                <div className="mt-3 h-8 w-24 animate-pulse rounded-full bg-[#e9eef8]" />
                <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-[#f1f5f9]" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-[#f1f5f9]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#e6ecf7] bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-full bg-[#e9eef8]" />
            <div className="h-3 w-64 animate-pulse rounded-full bg-[#f1f5f9]" />
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`vendor-action-skeleton-${index}`}
                className="h-11 w-32 animate-pulse rounded-xl border border-[#dbe2ef] bg-[#f8fafc]"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              key={`vendor-left-card-skeleton-${index}`}
              className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="space-y-3">
                <div className="h-5 w-36 animate-pulse rounded-full bg-[#e9eef8]" />
                <div className="h-3 w-32 animate-pulse rounded-full bg-[#f1f5f9]" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, itemIndex) => (
                  <div
                    key={`vendor-left-card-skeleton-${index}-${itemIndex}`}
                    className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-3 sm:min-h-[92px]"
                  >
                    <div className="h-3 w-20 animate-pulse rounded-full bg-[#edf2fb]" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f1f5f9]" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              key={`vendor-right-card-skeleton-${index}`}
              className="rounded-[24px] border border-[#e6ecf7] bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="space-y-3">
                <div className="h-5 w-36 animate-pulse rounded-full bg-[#e9eef8]" />
                <div className="h-3 w-32 animate-pulse rounded-full bg-[#f1f5f9]" />
              </div>
              <div className="mt-5 grid gap-3">
                {Array.from({ length: 3 }, (_, itemIndex) => (
                  <div
                    key={`vendor-right-card-skeleton-${index}-${itemIndex}`}
                    className="rounded-2xl bg-[#f8fafc] px-4 py-3"
                  >
                    <div className="h-3 w-20 animate-pulse rounded-full bg-[#edf2fb]" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f1f5f9]" />
                    <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
