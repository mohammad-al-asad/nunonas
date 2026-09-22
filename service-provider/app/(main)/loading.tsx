export default function DashboardLoading() {
  return (
    <div className="min-h-full animate-pulse bg-[#f8fafc]">
      <div className="space-y-8 p-4 sm:p-6 md:p-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 rounded-2xl bg-white" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3"><div className="h-96 rounded-2xl bg-white lg:col-span-2" /><div className="h-96 rounded-2xl bg-white" /></div>
      </div>
    </div>
  );
}
