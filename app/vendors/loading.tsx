export default function Loading() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Find Wedding Vendors</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
    </div>
  )
}
