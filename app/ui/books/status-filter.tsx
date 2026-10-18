'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { BOOK_STATUSES, STATUS_LABELS, type BookStatus } from '@/app/lib/definitions'
import { parseStatus } from '@/app/lib/utils'

const FILTERS: { status?: BookStatus; label: string }[] = [
  { label: 'All' },
  ...BOOK_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status] })),
]

export default function StatusFilter() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const current = parseStatus(searchParams.get('status'))

  function hrefFor(status?: BookStatus) {
    const params = new URLSearchParams(searchParams)
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    const search = params.toString()
    return search ? `${pathname}?${search}` : pathname
  }

  return (
    <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
      {FILTERS.map(({ status, label }) => {
        const isCurrent = status === current
        return (
          <Link
            key={label}
            href={hrefFor(status)}
            aria-current={isCurrent ? 'page' : undefined}
            className={clsx(
              'rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
              isCurrent
                ? 'border-black bg-black text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
