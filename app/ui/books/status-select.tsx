'use client'

import { startTransition, useActionState, useOptimistic } from 'react'
import { updateBookStatus, type StatusState } from '@/app/lib/actions'
import { BOOK_STATUSES, STATUS_LABELS, type BookStatus } from '@/app/lib/definitions'
import { parseStatus } from '@/app/lib/utils'

// Saves on change: the chosen status shows at once (useOptimistic) while the Server Action runs
// through useActionState. The optimistic value lasts only while the action is pending, so a
// failed save falls back to the saved `status` prop. This is not a <form action>: React resets
// a form after its action finishes, which would drop the select to its first option.
export default function StatusSelect({
  id,
  title,
  status,
}: {
  id: number
  title: string
  status: BookStatus
}) {
  const initialState: StatusState = { message: null }
  const [state, formAction] = useActionState(updateBookStatus.bind(null, id), initialState)
  const [shown, setShown] = useOptimistic(status)
  const errorId = `status-error-${id}`

  function save(value: string) {
    const next = parseStatus(value)
    if (!next) return
    const formData = new FormData()
    formData.set('status', next)
    startTransition(() => {
      setShown(next)
      formAction(formData)
    })
  }

  return (
    <div>
      <select
        name="status"
        value={shown}
        onChange={(event) => save(event.currentTarget.value)}
        aria-label={`Status of ${title}`}
        aria-describedby={errorId}
        className="rounded border border-gray-300 px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {BOOK_STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <div id={errorId} aria-live="polite" aria-atomic="true">
        {state.message ? <p className="mt-1 text-sm text-red-700">{state.message}</p> : null}
      </div>
    </div>
  )
}
