export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-neutral-200 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 h-[88px]" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 h-[300px]" />
      <div className="bg-white rounded-xl border border-neutral-200 h-[200px]" />
    </div>
  );
}
