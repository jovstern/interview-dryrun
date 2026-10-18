export const BOOK_STATUSES = ['want_to_read', 'reading', 'read'] as const

export type BookStatus = (typeof BOOK_STATUSES)[number]

export const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: 'Want to read',
  reading: 'Reading',
  read: 'Read',
}

export type Book = {
  id: number
  title: string
  author: string
  status: BookStatus
  createdAt: string
}
