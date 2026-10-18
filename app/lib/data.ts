import { connection } from 'next/server'
import { getDb } from './db'
import type { Book, BookStatus } from './definitions'
import { escapeLike } from './utils'

type BookRow = Omit<Book, 'createdAt'> & { created_at: string }

export async function fetchBooks(
  filters: { query?: string; status?: BookStatus } = {},
): Promise<Book[]> {
  // better-sqlite3 is synchronous: without this the query would run during prerendering.
  await connection()
  const where: string[] = []
  const params: string[] = []
  const query = filters.query?.trim()
  if (query) {
    where.push("title LIKE ? ESCAPE '\\'")
    params.push(`%${escapeLike(query)}%`)
  }
  if (filters.status) {
    where.push('status = ?')
    params.push(filters.status)
  }
  const whereSql = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''
  try {
    const rows = getDb()
      .prepare(
        `SELECT id, title, author, status, created_at FROM books${whereSql} ORDER BY created_at DESC, id DESC`,
      )
      .all(...params) as BookRow[]
    return rows.map(({ created_at, ...book }) => ({ ...book, createdAt: created_at }))
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to load books')
  }
}
