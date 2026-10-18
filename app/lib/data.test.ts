// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb, openDb } from './db'
import { fetchBooks } from './data'

vi.hoisted(() => {
  process.env.DATABASE_PATH = ':memory:'
})

vi.mock('next/server', () => ({ connection: async () => {} }))

const tmpFile = path.join(os.tmpdir(), `reading-list-test-${process.pid}-${Date.now()}.db`)

beforeEach(() => {
  expect(getDb().name).toBe(':memory:')
  getDb().exec('DELETE FROM books')
})

afterAll(() => {
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(tmpFile + suffix, { force: true })
})

function insertBook(title: string, author: string) {
  getDb().prepare('INSERT INTO books (title, author) VALUES (?, ?)').run(title, author)
}

describe('fetchBooks', () => {
  it('fetchBooks returns [] when there are no books', async () => {
    expect(await fetchBooks()).toEqual([])
  })

  it('fetchBooks returns books newest first with their fields', async () => {
    insertBook('Dune', 'Frank Herbert')
    insertBook('Emma', 'Jane Austen')

    const books = await fetchBooks()

    expect(books).toMatchObject([
      { title: 'Emma', author: 'Jane Austen', status: 'want_to_read' },
      { title: 'Dune', author: 'Frank Herbert', status: 'want_to_read' },
    ])
    expect(typeof books[0].id).toBe('number')
    expect(books[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('openDb', () => {
  it('openDb keeps books after the database is closed and reopened', () => {
    const first = openDb(tmpFile)
    first.prepare('INSERT INTO books (title, author) VALUES (?, ?)').run('Dune', 'Frank Herbert')
    first.close()

    const second = openDb(tmpFile)
    const row = second.prepare('SELECT title, author FROM books').get()
    second.close()

    expect(row).toEqual({ title: 'Dune', author: 'Frank Herbert' })
  })
})
