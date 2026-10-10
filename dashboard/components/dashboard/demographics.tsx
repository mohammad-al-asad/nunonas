export type DemographicCount = { key: string; count: number };

export type CustomerDemographicsData = {
  total_customers?: number;
  gender?: DemographicCount[];
  age_groups?: DemographicCount[];
  new_customers?: number;
  returning_customers?: number;
  never_booked?: number;
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
  never: "Not booked yet",
  new: "Booked once",
  returning: "Returning"
};

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function BarList({ title, rows, total }: { title: string; rows: DemographicCount[]; total: number }) {
  // Hide empty "Other" / "Not shared" rows so the chart only shows what exists.
  const visible = rows.filter((row) => row.count > 0 || !["other", "unknown"].includes(row.key));
  return (
    <div>
      <h4 className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8b96ad]">{title}</h4>
      <ul className="m-0 list-none space-y-2.5 p-0">
        {visible.map((row) => {
          const share = percent(row.count, total);
          const muted = row.key === "unknown" || row.key === "never";
          return (
            <li key={row.key} className="grid grid-cols-[96px_1fr_72px] items-center gap-3 text-[12px]">
              <span className={muted ? "text-[#9aa6c0]" : "text-[#5b6e92]"}>{LABELS[row.key] ?? row.key}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-[#eef2fb]" aria-hidden="true">
                <span
                  className={`block h-full rounded-full ${muted ? "bg-[#c5cede]" : "bg-[#2f55c8]"}`}
                  style={{ width: `${share}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums text-[#1f2b43]">
                {row.count} <span className="font-normal text-[#8b96ad]">({share}%)</span>
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
  return (
    <section className="rounded-xl border border-[#dbe2ef] bg-white p-4">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-[24px] font-semibold text-[#1f2b43]">Customer Demographics</h3>
        <p className="m-0 text-[12px] text-[#8b96ad]">{total} registered app customers</p>
      </div>
      {total === 0 ? (
        <p className="m-0 py-8 text-center text-[13px] text-[#8b96ad]">No customer data yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <BarList title="Gender" rows={data?.gender ?? []} total={total} />
          <BarList title="Age group" rows={data?.age_groups ?? []} total={total} />
          <BarList
            title="Booking activity"
            rows={[
              { key: "never", count: data?.never_booked ?? 0 },
              { key: "new", count: data?.new_customers ?? 0 },
              { key: "returning", count: data?.returning_customers ?? 0 }
            ]}
            total={total}
          />
        </div>
      )}
    </section>
  );
}
