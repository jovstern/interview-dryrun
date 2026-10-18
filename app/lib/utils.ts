import { BOOK_STATUSES, type BookStatus } from './definitions'

export function parseStatus(value: unknown): BookStatus | undefined {
  return typeof value === 'string' && (BOOK_STATUSES as readonly string[]).includes(value)
    ? (value as BookStatus)
    : undefined
}

/** The first value of a search param that may repeat, like `URLSearchParams.get()`. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** Escapes `\`, `%` and `_` so the text matches literally in `LIKE ? ESCAPE '\'`. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`)
}
