export type DemographicCount = { key: string; count: number };

export type CustomerDemographicsData = {
  total_customers?: number;
  gender?: DemographicCount[];
  age_groups?: DemographicCount[];
  new_customers?: number;
  returning_customers?: number;
};

const LABELS: Record<string, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  unknown: "Not shared",
  under_18: "Under 18",
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_54": "45–54",
  "55_plus": "55+",
  new: "One visit",
  returning: "Returning",
};

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function BarList({ title, rows, total }: { title: string; rows: DemographicCount[]; total: number }) {
  // Hide empty "Other" / "Not shared" rows so the chart only shows what exists.
  const visible = rows.filter((row) => row.count > 0 || !["other", "unknown"].includes(row.key));
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
      <ul className="space-y-2.5">
        {visible.map((row) => {
          const share = percent(row.count, total);
          const muted = row.key === "unknown";
          return (
            <li key={row.key} className="grid grid-cols-[80px_1fr_72px] items-center gap-3 text-sm">
              <span className={muted ? "text-slate-400" : "text-slate-600"}>{LABELS[row.key] ?? row.key}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <span
                  className={`block h-full rounded-full ${muted ? "bg-slate-300" : "bg-[#2f55c8]"}`}
                  style={{ width: `${share}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums text-slate-700">
                {row.count} <span className="font-normal text-slate-400">({share}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CustomerDemographics({ data }: { data?: CustomerDemographicsData }) {
  const total = data?.total_customers ?? 0;
  const newCustomers = data?.new_customers ?? 0;
  const returning = data?.returning_customers ?? 0;
  return (
    <section aria-labelledby="customer-demographics-title" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="customer-demographics-title" className="text-sm font-bold text-slate-800">Customer Demographics</h3>
        <p className="text-xs text-slate-400">{total} app customers who booked with you · manual bookings excluded</p>
      </div>
      {total === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No customer data yet</div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <BarList title="Gender" rows={data?.gender ?? []} total={total} />
          <BarList title="Age group" rows={data?.age_groups ?? []} total={total} />
          <BarList
            title="Visits"
            rows={[
              { key: "new", count: newCustomers },
              { key: "returning", count: returning },
            ]}
            total={total}
          />
        </div>
      )}
    </section>
  );
}
