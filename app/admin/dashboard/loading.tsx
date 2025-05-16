export default function Loading() {
  return (
    <div className="container py-8">
      <div className="h-8 w-1/4 animate-pulse rounded bg-muted"></div>
      <div className="mt-6 grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
      <div className="mt-8 h-[400px] animate-pulse rounded-lg bg-muted"></div>
    </div>
  )
}
