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
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-gray-700">We couldn&apos;t load your books.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="font-medium text-blue-700 underline hover:text-blue-900"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
