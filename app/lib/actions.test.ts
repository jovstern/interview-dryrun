// @vitest-environment node
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBook } from './actions'
import { getDb } from './db'

vi.hoisted(() => {
  process.env.DATABASE_PATH = ':memory:'
})

vi.mock('next/cache')
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

beforeEach(() => {
  expect(getDb().name).toBe(':memory:')
  getDb().exec('DELETE FROM books')
  vi.clearAllMocks()
})

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function rows() {
  return getDb().prepare('SELECT title, author, status FROM books').all()
}

describe('createBook', () => {
  it('adds a trimmed book and redirects home', async () => {
    await createBook({}, form({ title: ' Dune ', author: ' Frank Herbert ' }))

    expect(rows()).toEqual([{ title: 'Dune', author: 'Frank Herbert', status: 'want_to_read' }])
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('saves the chosen status', async () => {
    await createBook({}, form({ title: 'Dune', author: 'Frank Herbert', status: 'reading' }))

    expect(rows()).toEqual([{ title: 'Dune', author: 'Frank Herbert', status: 'reading' }])
  })

  it('requires title and author', async () => {
    const input = { title: '', author: '', status: 'want_to_read' }
    const state = await createBook({}, form(input))

    expect(state.errors?.title).toEqual(['Enter a title'])
    expect(state.errors?.author).toEqual(['Enter an author'])
    expect(state.message).toBe('Fix the highlighted fields.')
    expect(state.values).toEqual(input)
    expect(rows()).toEqual([])
    expect(redirect).not.toHaveBeenCalled()
  })

  it('treats whitespace-only fields as empty', async () => {
    const state = await createBook({}, form({ title: '   ', author: '   ' }))

    expect(state.errors?.title).toEqual(['Enter a title'])
    expect(state.errors?.author).toEqual(['Enter an author'])
    expect(state.values).toEqual({ title: '   ', author: '   ', status: '' })
    expect(rows()).toEqual([])
  })

  it('rejects a 201-character title', async () => {
    const state = await createBook({}, form({ title: 'a'.repeat(201), author: 'Frank Herbert' }))

    expect(state.errors?.title).toEqual(['Title must be 200 characters or fewer'])
    expect(rows()).toEqual([])
  })

  it('rejects a 101-character author', async () => {
    const state = await createBook({}, form({ title: 'Dune', author: 'a'.repeat(101) }))

    expect(state.errors?.author).toEqual(['Author must be 100 characters or fewer'])
    expect(rows()).toEqual([])
  })

  it('rejects an unknown status', async () => {
    const state = await createBook(
      {},
      form({ title: 'Dune', author: 'Frank Herbert', status: 'finished' }),
    )

    expect(state.errors?.status).toEqual(['Choose a status'])
    expect(rows()).toEqual([])
  })
})
