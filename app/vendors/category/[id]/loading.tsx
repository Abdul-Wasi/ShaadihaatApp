export default function Loading() {
  return (
    <div className="container py-8">
      <div className="h-8 w-1/3 animate-pulse rounded bg-muted mb-2"></div>
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted mb-8"></div>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
    </div>
  )
}
