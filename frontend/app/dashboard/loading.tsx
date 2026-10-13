export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 bg-secondary rounded-xl w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-5">
            <div className="w-10 h-10 bg-secondary rounded-xl mb-3" />
            <div className="h-7 bg-secondary rounded-lg w-16 mb-1" />
            <div className="h-4 bg-secondary rounded-lg w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="h-6 bg-secondary rounded-lg w-40 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border border-border rounded-xl mb-3">
            <div className="w-14 h-14 bg-secondary rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
