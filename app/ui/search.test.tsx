import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Search from './search'

const { replace, nav } = vi.hoisted(() => ({
  replace: vi.fn<(href: string) => void>(),
  nav: { search: '' },
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => '/',
  useRouter: () => ({ replace }),
}))

function type(value: string) {
  fireEvent.change(screen.getByLabelText('Search books by title'), { target: { value } })
  act(() => {
    vi.advanceTimersByTime(300)
  })
}

describe('Search', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    replace.mockReset()
    nav.search = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes the query to the URL after typing', () => {
    render(<Search placeholder="Search by title…" />)
    const input = screen.getByLabelText('Search books by title')
    expect(input).toHaveAttribute('placeholder', 'Search by title…')

    fireEvent.change(input, { target: { value: 'dune' } })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(replace).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(replace).toHaveBeenCalledExactlyOnceWith('/?query=dune')
  })

  it('removes query when cleared', () => {
    nav.search = 'query=dune'
    render(<Search placeholder="Search by title…" />)
    expect(screen.getByLabelText('Search books by title')).toHaveValue('dune')

    type('')
    expect(replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('keeps status', () => {
    nav.search = 'status=read'
    render(<Search placeholder="Search by title…" />)

    type('dune')
    expect(replace).toHaveBeenCalledExactlyOnceWith('/?status=read&query=dune')
  })
})
