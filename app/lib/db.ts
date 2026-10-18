import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS books (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  author     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'want_to_read'
             CHECK (status IN ('want_to_read', 'reading', 'read')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`

export function openDb(file: string): Database.Database {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.exec(SCHEMA)
  return db
}

// Cached on globalThis so dev-server module reloads reuse the open connection.
const globalForDb = globalThis as unknown as { readingListDb?: Database.Database }

export function getDb(): Database.Database {
  globalForDb.readingListDb ??= openDb(process.env.DATABASE_PATH ?? 'data/reading-list.db')
  return globalForDb.readingListDb
}
