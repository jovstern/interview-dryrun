'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const urlQuery = searchParams.get('query') ?? ''

  // A controlled input rather than the usual uncontrolled `defaultValue`: Next keeps this
  // instance across search-param navigation, so an uncontrolled box kept stale text after the
  // "Clear search and filter" link or back/forward. When the URL's query changes, adjust state
  // during render (React docs, "adjusting state when a prop changes"); skip it when the URL
  // only caught up with this box's own debounced write, so typing is never overwritten.
  const [value, setValue] = useState(urlQuery)
  const [seenQuery, setSeenQuery] = useState(urlQuery)
  const [writtenQuery, setWrittenQuery] = useState<string | null>(null)
  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery)
    if (urlQuery !== writtenQuery) {
      setValue(urlQuery)
      setWrittenQuery(null)
    }
  }

  const handleSearch = useDebouncedCallback((term: string) => {
    setWrittenQuery(term)
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
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          handleSearch(event.target.value)
        }}
      />
    </div>
  )
}
