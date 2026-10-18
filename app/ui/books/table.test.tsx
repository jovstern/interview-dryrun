import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Book } from '@/app/lib/definitions'
import { BooksList } from './table'

const dune: Book = {
  id: 1,
  title: 'Dune',
  author: 'Frank Herbert',
  status: 'reading',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('BooksList', () => {
  it("shows each book's title, author and status label", () => {
    render(<BooksList books={[dune]} />)
    expect(screen.getByRole('table', { name: 'Your books' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Dune' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Frank Herbert' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Reading' })).toBeInTheDocument()
  })

  it('shows the empty state when there are no books', () => {
    render(<BooksList books={[]} />)
    expect(screen.getByText('Your reading list is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add your first book' })).toHaveAttribute(
      'href',
      '/books/new',
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
