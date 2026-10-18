import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateBookState } from '@/app/lib/actions'
import CreateBookForm from './create-form'

const { createBook } = vi.hoisted(() => ({
  createBook: vi.fn<(prevState: CreateBookState, formData: FormData) => Promise<CreateBookState>>(),
}))

vi.mock('@/app/lib/actions', () => ({ createBook }))

describe('CreateBookForm', () => {
  beforeEach(() => {
    createBook.mockReset()
  })

  it('shows field errors linked to their inputs', async () => {
    createBook.mockResolvedValue({
      errors: { title: ['Enter a title'], author: ['Enter an author'] },
      message: 'Fix the highlighted fields.',
      values: { title: '', author: '', status: 'want_to_read' },
    })
    const user = userEvent.setup()
    render(<CreateBookForm />)

    const title = screen.getByLabelText('Title')
    const author = screen.getByLabelText('Author')
    expect(title).not.toHaveAttribute('aria-invalid')
    expect(author).not.toHaveAttribute('aria-invalid')

    // Native `required` would block the submit in jsdom; type a space so the server decides.
    await user.type(title, ' ')
    await user.type(author, ' ')
    await user.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByText('Fix the highlighted fields.')).toBeInTheDocument()
    expect(document.getElementById('title-error')).toHaveTextContent('Enter a title')
    expect(title).toHaveAttribute('aria-describedby', 'title-error')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(document.getElementById('author-error')).toHaveTextContent('Enter an author')
    expect(author).toHaveAttribute('aria-describedby', 'author-error')
    expect(author).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps typed values after a validation error', async () => {
    createBook.mockResolvedValue({
      errors: { author: ['Enter an author'] },
      message: 'Fix the highlighted fields.',
      values: { title: 'Dune', author: '', status: 'read' },
    })
    const user = userEvent.setup()
    render(<CreateBookForm />)

    expect(screen.getByLabelText('Status')).toHaveDisplayValue('Want to read')

    await user.type(screen.getByLabelText('Title'), 'Dune')
    await user.type(screen.getByLabelText('Author'), ' ')
    await user.selectOptions(screen.getByLabelText('Status'), 'read')
    await user.click(screen.getByRole('button', { name: 'Add book' }))

    expect(await screen.findByText('Fix the highlighted fields.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Dune')
    expect(screen.getByLabelText('Status')).toHaveDisplayValue('Read')
  })
})
