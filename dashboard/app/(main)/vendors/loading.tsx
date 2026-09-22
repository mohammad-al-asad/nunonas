function VendorsPageSkeleton() {
  return (
    <section className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`vendors-summary-skeleton-${index}`}
            className="min-h-[120px] animate-pulse rounded-2xl border border-[#e6ecf7] bg-white p-5 shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="h-3 w-24 rounded-full bg-[#e9eef8]" />
              <div className="h-9 w-9 rounded-lg bg-[#edf2fb]" />
            </div>
            <div className="h-9 w-20 rounded-full bg-[#edf2fb]" />
            <div className="mt-4 h-3 w-28 rounded-full bg-[#f1f5f9]" />
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e6ecf7] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div className="h-4 w-32 rounded-full bg-[#e9eef8]" />
          <div className="h-8 w-20 rounded-lg bg-[#f3f6fd]" />
        </div>

        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[980px] border-collapse text-[15px]">
            <thead>
              <tr>
                {["VENDOR ID", "BUSINESS NAME", "OWNER", "CATEGORY", "BOOKINGS", "RATING", "STATUS", "ACTIONS"].map((head) => (
                  <th
                    key={head}
                    className="border-b border-[#edf1fa] px-4 py-3 text-left text-[10px] tracking-[0.06em] text-[#7d8ba6]"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={`vendors-row-skeleton-${index}`} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf2fb]" />
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 animate-pulse rounded bg-[#edf2fb]" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3 w-32 animate-pulse rounded-full bg-[#edf2fb]" />
                        <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#f1f5f9]" />
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf2fb]" />
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="h-6 w-20 animate-pulse rounded bg-[#f1f5f9]" />
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="h-3 w-12 animate-pulse rounded-full bg-[#edf2fb]" />
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-16 animate-pulse rounded-full bg-[#edf2fb]" />
                      <div className="h-3 w-8 animate-pulse rounded-full bg-[#f1f5f9]" />
                    </div>
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-[#f3f6fd]" />
                  </td>
                  <td className="border-b border-[#edf1fa] px-4 py-4">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 3 }, (_, actionIndex) => (
                        <div
                          key={`vendors-action-skeleton-${index}-${actionIndex}`}
                          className="h-6 w-6 animate-pulse rounded-full bg-[#edf2fb]"
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between px-5 py-4">
          <div className="h-3 w-48 animate-pulse rounded-full bg-[#edf2fb]" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={`vendors-pagination-skeleton-${index}`}
                className="h-6 w-12 animate-pulse rounded border border-[#e6ecf7] bg-[#f8fafc]"
              />
            ))}
          </div>
        </footer>
      </section>
    </section>
  );
}

export default function Loading() {
  return <VendorsPageSkeleton />;
}
