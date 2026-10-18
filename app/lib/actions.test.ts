// @vitest-environment node
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBook, updateBookStatus } from './actions'
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

afterEach(() => {
  vi.restoreAllMocks()
})

function failDb() {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(getDb(), 'prepare').mockImplementation(() => {
    throw new Error('boom')
  })
}

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

  it('createBook returns a message when the insert fails', async () => {
    const input = { title: 'Dune', author: 'Frank Herbert', status: 'reading' }
    failDb()

    const state = await createBook({}, form(input))

    expect(state).toEqual({ message: 'Could not add the book. Please try again.', values: input })
    expect(console.error).toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('updateBookStatus', () => {
  function insertBook() {
    const result = getDb()
      .prepare('INSERT INTO books (title, author, status) VALUES (?, ?, ?)')
      .run('Dune', 'Frank Herbert', 'want_to_read')
    return Number(result.lastInsertRowid)
  }

  it("changes a book's status", async () => {
    const id = insertBook()
    const state = await updateBookStatus(id, {}, form({ status: 'read' }))

    expect(state).toEqual({ message: null })
    expect(rows()).toEqual([{ title: 'Dune', author: 'Frank Herbert', status: 'read' }])
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('rejects an unknown status', async () => {
    const id = insertBook()
    const state = await updateBookStatus(id, {}, form({ status: 'finished' }))

    expect(state.message).toBe('Choose a status')
    expect(rows()).toEqual([{ title: 'Dune', author: 'Frank Herbert', status: 'want_to_read' }])
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('reports a missing book', async () => {
    const state = await updateBookStatus(999, {}, form({ status: 'read' }))

    expect(state.message).toBe('This book no longer exists.')
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('updateBookStatus returns a message when the update fails', async () => {
    const id = insertBook()
    failDb()

    const state = await updateBookStatus(id, {}, form({ status: 'read' }))

    expect(state).toEqual({ message: 'Could not save the status. Please try again.' })
    expect(console.error).toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('updateBookStatus rejects a missing status', async () => {
    const id = insertBook()
    const state = await updateBookStatus(id, {}, form({}))

    expect(state.message).toBe('Choose a status')
    expect(rows()).toEqual([{ title: 'Dune', author: 'Frank Herbert', status: 'want_to_read' }])
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
