import Link from 'next/link'
import { Suspense } from 'react'
import { firstParam, parseStatus } from '@/app/lib/utils'
import StatusFilter from '@/app/ui/books/status-filter'
import BooksTable from '@/app/ui/books/table'
import Search from '@/app/ui/search'
import { BooksTableSkeleton } from '@/app/ui/skeletons'

export default function Page(props: PageProps<'/'>) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reading list</h1>
        <Link
          href="/books/new"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add book
        </Link>
      </div>
      <Suspense fallback={<div className="h-20" aria-hidden="true" />}>
        <div className="flex flex-col gap-3">
          <Search placeholder="Search by title…" />
          <StatusFilter />
        </div>
      </Suspense>
      <Suspense fallback={<BooksTableSkeleton />}>
        <FilteredBooks searchParams={props.searchParams} />
      </Suspense>
    </main>
  )
}

async function FilteredBooks({ searchParams }: { searchParams: PageProps<'/'>['searchParams'] }) {
  const params = await searchParams
  const query = firstParam(params.query) ?? ''
  const status = parseStatus(firstParam(params.status))
  return (
    <Suspense key={`${query}|${status ?? ''}`} fallback={<BooksTableSkeleton />}>
      <BooksTable query={query} status={status} />
    </Suspense>
  )
}
