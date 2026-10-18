export function BooksTableSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-8 w-full animate-pulse rounded bg-gray-100" />
      ))}
    </div>
  )
}
