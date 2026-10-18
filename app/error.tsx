'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

// Next.js 16.3+ passes `retry` (re-fetches and re-renders the segment), which the docs
// recommend over `reset` for errors from server data.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 p-10 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-gray-700">We couldn&apos;t load your books.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
