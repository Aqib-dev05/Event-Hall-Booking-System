export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 bg-secondary rounded-xl w-56" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-5">
            <div className="w-10 h-10 bg-secondary rounded-xl mb-3" />
            <div className="h-7 bg-secondary rounded-lg w-16 mb-1" />
            <div className="h-4 bg-secondary rounded-lg w-28" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="h-6 bg-secondary rounded-lg w-48 mb-4" />
        <div className="h-56 bg-secondary rounded-xl" />
      </div>
    </div>
  )
}
