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
  return <BooksList books={books} />
}

export function BooksList({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 p-10 text-center">
        <p className="text-gray-700">Your reading list is empty</p>
        <Link href="/books/new" className="font-medium text-blue-700 underline hover:text-blue-900">
          Add your first book
        </Link>
      </div>
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
