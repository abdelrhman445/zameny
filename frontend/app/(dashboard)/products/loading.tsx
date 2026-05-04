export default function ProductsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 skeleton w-40" />
          <div className="h-4 skeleton w-28" />
        </div>
        <div className="h-9 skeleton w-28 rounded-lg" />
      </div>
      <div className="h-10 skeleton max-w-sm rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border p-4 space-y-3">
            <div className="aspect-square skeleton rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 skeleton w-3/4" />
              <div className="h-3 skeleton w-1/2" />
              <div className="h-6 skeleton w-2/3 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
