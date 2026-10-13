export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 bg-secondary rounded-xl w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="h-48 bg-secondary" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-secondary rounded-lg w-3/4" />
              <div className="h-4 bg-secondary rounded-lg w-1/2" />
              <div className="h-4 bg-secondary rounded-lg w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
