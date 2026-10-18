import type { Metadata } from 'next'
import CreateBookForm from '@/app/ui/books/create-form'

export const metadata: Metadata = {
  title: 'Add book',
}

export default function Page() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Add a book</h1>
      <CreateBookForm />
    </main>
  )
}
