function UsersPageSkeleton() {
  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={`users-summary-skeleton-${index}`}
              className="rounded-xl border border-[#dbe2ef] bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-[#edf2fb]" />
                <div className="h-5 w-12 animate-pulse rounded bg-[#f3f6fd]" />
              </div>
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf2fb]" />
              <div className="mt-3 h-10 w-20 animate-pulse rounded-full bg-[#e9eef8]" />
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-[#dbe2ef] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#e6ecf7] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex h-9 w-full max-w-[420px] items-center rounded-lg border border-[#edf1fa] bg-[#f7f9fd] px-3">
              <div className="h-3 w-40 animate-pulse rounded-full bg-[#e9eef8]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-lg border border-[#dbe2ef] bg-white" />
              <div className="h-9 w-28 animate-pulse rounded-lg border border-[#dbe2ef] bg-white" />
            </div>
          </div>

          <div className="overflow-x-hidden px-4">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["USER ID", "NAME", "STATUS", "TOTAL BOOKINGS", "JOINED DATE", "ACTIONS"].map((head) => (
                    <th
                      key={head}
                      className="border-b border-[#edf1fa] px-4 py-3 text-left text-[11px] tracking-[0.04em] text-[#6e7f9b]"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, index) => (
                  <tr key={`users-row-skeleton-${index}`} className={index % 2 === 1 ? "bg-[#fbfcff]" : ""}>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf2fb]" />
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 animate-pulse rounded-full bg-[#edf2fb]" />
                        <div className="space-y-2">
                          <div className="h-3 w-28 animate-pulse rounded-full bg-[#e9eef8]" />
                          <div className="h-2.5 w-36 animate-pulse rounded-full bg-[#f1f5f9]" />
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-[#f3f6fd]" />
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="h-3 w-10 animate-pulse rounded-full bg-[#edf2fb]" />
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf2fb]" />
                    </td>
                    <td className="border-b border-[#edf1fa] px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-4 animate-pulse rounded-full bg-[#edf2fb]" />
                        <div className="h-4 w-4 animate-pulse rounded-full bg-[#edf2fb]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex items-center justify-between px-4 py-4">
            <div className="h-3 w-44 animate-pulse rounded-full bg-[#edf2fb]" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={`users-pagination-skeleton-${index}`}
                  className="h-8 w-12 animate-pulse rounded border border-[#dbe2ef] bg-white"
                />
              ))}
            </div>
          </footer>
        </section>
      </div>
    </section>
  );
}

export default function Loading() {
  return <UsersPageSkeleton />;
}
