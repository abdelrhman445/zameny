export default function OrdersLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 skeleton w-36" />
          <div className="h-4 skeleton w-24" />
        </div>
        <div className="h-9 skeleton w-20 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 skeleton flex-1 rounded-lg" />
        <div className="h-10 skeleton w-36 rounded-lg" />
        <div className="h-10 skeleton w-36 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 skeleton w-28" />
              <div className="h-4 skeleton w-32" />
              <div className="h-4 skeleton w-20" />
              <div className="h-6 skeleton w-16 rounded-full" />
              <div className="h-6 skeleton w-20 rounded-full" />
              <div className="h-4 skeleton w-24 mr-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
