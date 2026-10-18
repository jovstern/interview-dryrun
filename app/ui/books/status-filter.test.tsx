import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatusFilter from './status-filter'

const { nav } = vi.hoisted(() => ({ nav: { search: '' } }))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => '/',
}))

function link(name: string) {
  return screen.getByRole('link', { name })
}

describe('StatusFilter', () => {
  beforeEach(() => {
    nav.search = ''
  })

  it('marks the current status', () => {
    nav.search = 'status=reading'
    render(<StatusFilter />)

    expect(screen.getByRole('navigation', { name: 'Filter by status' })).toBeInTheDocument()
    expect(link('Reading')).toHaveAttribute('aria-current', 'page')
    for (const name of ['All', 'Want to read', 'Read']) {
      expect(link(name)).not.toHaveAttribute('aria-current')
    }
  })

  it('marks All when the status is missing or unknown', () => {
    nav.search = 'status=bogus'
    render(<StatusFilter />)

    expect(link('All')).toHaveAttribute('aria-current', 'page')
    expect(link('All')).toHaveAttribute('href', '/')
  })

  it('keeps the query in each link', () => {
    nav.search = 'query=dune'
    render(<StatusFilter />)

    expect(link('All')).toHaveAttribute('href', '/?query=dune')
    expect(link('Want to read')).toHaveAttribute('href', '/?query=dune&status=want_to_read')
    expect(link('Reading')).toHaveAttribute('href', '/?query=dune&status=reading')
    expect(link('Read')).toHaveAttribute('href', '/?query=dune&status=read')
  })
})
