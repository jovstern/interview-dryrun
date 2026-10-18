import Link from 'next/link'
import { fetchBooks } from '@/app/lib/data'
import type { Book, BookStatus } from '@/app/lib/definitions'
import StatusSelect from './status-select'

export default async function BooksTable({
  query,
  status,
}: {
  query: string
  status?: BookStatus
}) {
  const books = await fetchBooks({ query, status })
  return <BooksList books={books} filtered={query.trim() !== '' || status !== undefined} />
}

export function BooksList({ books, filtered }: { books: Book[]; filtered: boolean }) {
  if (books.length === 0) {
    return filtered ? (
      <EmptyState
        message="No books match your search"
        href="/"
        linkText="Clear search and filter"
        variant="secondary"
      />
    ) : (
      <EmptyState
        message="Your reading list is empty"
        href="/books/new"
        linkText="Add your first book"
        variant="primary"
      />
    )
  }

  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Your books</caption>
      <thead className="border-b border-gray-200 text-gray-600">
        <tr>
          <th scope="col" className="py-2 pr-4 font-medium">
            Title
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Author
          </th>
          <th scope="col" className="py-2 font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id} className="border-b border-gray-100 last:border-0">
            <td className="py-2 pr-4 font-medium">{book.title}</td>
            <td className="py-2 pr-4">{book.author}</td>
            <td className="py-2">
              <StatusSelect id={book.id} title={book.title} status={book.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Primary matches the "Add book" button on the page; secondary is its outlined counterpart.
const LINK_STYLES = {
  primary:
    'rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
  secondary:
    'rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
}

function EmptyState({
  message,
  href,
  linkText,
  variant,
}: {
  message: string
  href: string
  linkText: string
  variant: 'primary' | 'secondary'
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 p-10 text-center">
      <p className="text-gray-700">{message}</p>
      <Link href={href} className={LINK_STYLES[variant]}>
        {linkText}
      </Link>
    </div>
  )
}
