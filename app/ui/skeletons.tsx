// The wrapper is announced ("Loading books", busy); the placeholder shapes inside are decorative.
export function BooksTableSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading books" className="w-full text-sm">
      <div aria-hidden="true">
        <div className="flex gap-4 border-b border-gray-200 py-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-gray-100" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-100" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-gray-100 py-2 last:border-0"
          >
            <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-1/4 animate-pulse rounded bg-gray-100" />
            <div className="ml-auto h-8 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Same footprint as the search input plus the row of status filter pills. Purely visual.
export function ControlsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="h-[38px] w-full animate-pulse rounded border border-gray-200 bg-gray-50" />
      <div className="flex flex-wrap gap-2">
        {['w-12', 'w-28', 'w-20', 'w-14'].map((width) => (
          <div key={width} className={`h-[30px] ${width} animate-pulse rounded-full bg-gray-100`} />
        ))}
      </div>
    </div>
  )
}
