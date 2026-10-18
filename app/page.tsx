import Link from 'next/link'
import { Suspense } from 'react'
import BooksTable from '@/app/ui/books/table'
import { BooksTableSkeleton } from '@/app/ui/skeletons'

export default function Page() {
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
      <Suspense fallback={<BooksTableSkeleton />}>
        <BooksTable />
      </Suspense>
    </main>
  )
}
