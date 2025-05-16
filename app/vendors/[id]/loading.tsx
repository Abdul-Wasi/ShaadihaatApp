export default function Loading() {
  return (
    <div className="container py-8">
      <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted"></div>
      <div className="mt-6 h-8 w-1/3 animate-pulse rounded bg-muted"></div>
      <div className="mt-4 h-4 w-1/4 animate-pulse rounded bg-muted"></div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="col-span-2 h-[400px] animate-pulse rounded-lg bg-muted"></div>
        <div className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
      </div>
    </div>
  )
}
