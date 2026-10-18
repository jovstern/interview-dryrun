'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    const search = params.toString()
    replace(search ? `${pathname}?${search}` : pathname)
  }, 300)

  return (
    <div className="relative flex flex-1">
      <label htmlFor="search" className="sr-only">
        Search books by title
      </label>
      <input
        id="search"
        type="search"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        placeholder={placeholder}
        defaultValue={searchParams.get('query') ?? ''}
        onChange={(event) => handleSearch(event.target.value)}
      />
    </div>
  )
}
