// Adds sample books for a demo, only when the list is empty.
// Run: npm run seed (uses DATABASE_PATH, default data/reading-list.db)
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

// Keep in sync with SCHEMA in app/lib/db.ts.
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

const BOOKS = [
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', status: 'read' },
  { title: 'Piranesi', author: 'Susanna Clarke', status: 'read' },
  { title: 'Project Hail Mary', author: 'Andy Weir', status: 'reading' },
  { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', status: 'reading' },
  { title: 'Middlemarch', author: 'George Eliot', status: 'want_to_read' },
  { title: 'The Dispossessed', author: 'Ursula K. Le Guin', status: 'want_to_read' },
]

const file = process.env.DATABASE_PATH ?? 'data/reading-list.db'
fs.mkdirSync(path.dirname(file), { recursive: true })
const db = new Database(file)
db.pragma('journal_mode = WAL')
db.exec(SCHEMA)

const { count } = db.prepare('SELECT COUNT(*) AS count FROM books').get()
if (count > 0) {
  console.log('Already has books, nothing to do')
} else {
  const insert = db.prepare('INSERT INTO books (title, author, status) VALUES (?, ?, ?)')
  db.transaction(() => {
    for (const book of BOOKS) insert.run(book.title, book.author, book.status)
  })()
  console.log(`Seeded ${BOOKS.length} books`)
}
db.close()
