// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb, openDb } from './db'
import { fetchBooks } from './data'
import type { Book, BookStatus } from './definitions'

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

function insertBook(title: string, author: string, status: BookStatus = 'want_to_read') {
  getDb()
    .prepare('INSERT INTO books (title, author, status) VALUES (?, ?, ?)')
    .run(title, author, status)
}

function titles(books: Book[]) {
  return books.map((book) => book.title)
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

  it('matches part of the title ignoring case', async () => {
    insertBook('Dune', 'Frank Herbert')
    insertBook('Emma', 'Jane Austen')

    expect(titles(await fetchBooks({ query: 'dun' }))).toEqual(['Dune'])
  })

  it('does not search author', async () => {
    insertBook('Dune', 'Frank Herbert')

    expect(await fetchBooks({ query: 'Herbert' })).toEqual([])
  })

  it('filters by status', async () => {
    insertBook('Dune', 'Frank Herbert', 'reading')
    insertBook('Emma', 'Jane Austen', 'read')

    expect(titles(await fetchBooks({ status: 'read' }))).toEqual(['Emma'])
  })

  it('combines query and status', async () => {
    insertBook('Dune', 'Frank Herbert', 'reading')
    insertBook('Dune Messiah', 'Frank Herbert', 'read')
    insertBook('Emma', 'Jane Austen', 'read')

    expect(titles(await fetchBooks({ query: 'dune', status: 'read' }))).toEqual(['Dune Messiah'])
  })

  it('treats % literally', async () => {
    insertBook('100% Dune', 'Nobody')
    insertBook('Dune', 'Frank Herbert')

    expect(titles(await fetchBooks({ query: '%' }))).toEqual(['100% Dune'])
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
