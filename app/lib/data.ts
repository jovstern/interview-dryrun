import { connection } from 'next/server'
import { getDb } from './db'
import type { Book } from './definitions'

type BookRow = Omit<Book, 'createdAt'> & { created_at: string }

export async function fetchBooks(): Promise<Book[]> {
  // better-sqlite3 is synchronous: without this the query would run during prerendering.
  await connection()
  try {
    const rows = getDb()
      .prepare(
        'SELECT id, title, author, status, created_at FROM books ORDER BY created_at DESC, id DESC',
      )
      .all() as BookRow[]
    return rows.map(({ created_at, ...book }) => ({ ...book, createdAt: created_at }))
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to load books')
  }
}
