export default function OverviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 skeleton w-48" />
        <div className="h-4 skeleton w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-6 space-y-3">
            <div className="h-3 skeleton w-24" />
            <div className="h-8 skeleton w-32" />
            <div className="h-3 skeleton w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 h-64 skeleton" />
        <div className="bg-white rounded-xl border p-6 h-64 skeleton" />
      </div>
    </div>
  );
}
