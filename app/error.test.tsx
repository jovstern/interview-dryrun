import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ErrorPage from './error'

describe('ErrorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the message and retries', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Failed to load books')
    const retry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorPage error={error} retry={retry} />)

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByText("We couldn't load your books.")).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(error)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(retry).toHaveBeenCalledTimes(1)
  })
})
