'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createBook, type CreateBookState } from '@/app/lib/actions'
import { BOOK_STATUSES, STATUS_LABELS } from '@/app/lib/definitions'

// Follows the form pattern (Next.js Learn, chapter 13): useActionState + a Server Action,
// labels tied to inputs, errors in aria-live regions linked by aria-describedby.
export default function CreateBookForm() {
  const initialState: CreateBookState = { message: null, errors: {} }
  const [state, formAction, isPending] = useActionState(createBook, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={state.values?.title}
          className="rounded border border-gray-300 px-3 py-2"
          aria-describedby="title-error"
          aria-invalid={state.errors?.title ? true : undefined}
        />
        <div id="title-error" aria-live="polite" aria-atomic="true">
          {state.errors?.title?.map((error) => (
            <p key={error} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="author" className="text-sm font-medium">
          Author
        </label>
        <input
          id="author"
          name="author"
          required
          maxLength={100}
          defaultValue={state.values?.author}
          className="rounded border border-gray-300 px-3 py-2"
          aria-describedby="author-error"
          aria-invalid={state.errors?.author ? true : undefined}
        />
        <div id="author-error" aria-live="polite" aria-atomic="true">
          {state.errors?.author?.map((error) => (
            <p key={error} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        {/* React applies a select's defaultValue only on mount, and resets the form after the
            action, so the key remounts the select with the status the action returned. */}
        <select
          key={state.values?.status}
          id="status"
          name="status"
          defaultValue={state.values?.status || 'want_to_read'}
          className="rounded border border-gray-300 px-3 py-2"
          aria-describedby="status-error"
          aria-invalid={state.errors?.status ? true : undefined}
        >
          {BOOK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <div id="status-error" aria-live="polite" aria-atomic="true">
          {state.errors?.status?.map((error) => (
            <p key={error} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Adding…' : 'Add book'}
        </button>
        <Link href="/" className="text-sm font-medium text-gray-700 underline hover:text-gray-900">
          Cancel
        </Link>
      </div>
    </form>
  )
}
