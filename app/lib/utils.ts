import { BOOK_STATUSES, type BookStatus } from './definitions'

export function parseStatus(value: unknown): BookStatus | undefined {
  return typeof value === 'string' && (BOOK_STATUSES as readonly string[]).includes(value)
    ? (value as BookStatus)
    : undefined
}
