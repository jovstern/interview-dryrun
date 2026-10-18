# Reading List — design

A single-user reading list: see your books, add one, move it between "want to read",
"reading" and "read", and find books by title and status through a link you can share.

## Requirements checklist (the assignment's words)

- [ ] **R1** "A page listing books with title, author and status (want to read / reading / read)."
- [ ] **R2** "Add a book with a form; title and author are required, with clear validation errors."
- [ ] **R3** "Change a book's status from the list."
- [ ] **R4** "Search books by title and filter by status; the search and filter must survive a
      page refresh and be shareable as a link."
- [ ] **R5** "Data must persist between server restarts."
- [ ] **R6** "Show sensible loading, empty and error states."

## Decisions from the question round (the user's)

- Database: **SQLite through `better-sqlite3`**, a local file.
- Status is changed with **a select in each row** that saves on change, updated optimistically.
- Scope: **the six requirements only** (no edit, no delete).
- The repo keeps its name `interview-dryrun`.

## Assumptions (my calls)

- No accounts: one shared list.
- A new book starts as "want to read"; the add form also lets you pick a status.
- Title max 200 characters, author max 100, both trimmed; whitespace-only counts as empty.
- Search matches a part of the title, ignoring case; author is not searched (the assignment
  says "by title").
- An unknown `status` value in the URL is ignored (shows all), not an error.
- List order: newest first.
- Duplicates are allowed (two editions of a book are real).
- No pagination: a personal list stays small. Listed as next step in the README.
- `npm run seed` adds a few sample books for the demo; the app starts empty without it.

## Data model

```sql
CREATE TABLE IF NOT EXISTS books (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  author     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'want_to_read'
             CHECK (status IN ('want_to_read', 'reading', 'read')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

Display labels: `want_to_read` → "Want to read", `reading` → "Reading", `read` → "Read".

The file is `process.env.DATABASE_PATH`, default `data/reading-list.db` (`data/` gitignored).
The schema is created on first open (`CREATE TABLE IF NOT EXISTS`), so there is no setup step.
Unit tests use `:memory:` or a temp file; Playwright uses `data/e2e.db`, deleted before each
run. Tests never touch `data/reading-list.db`.

## Routes and screens

| Route | Screen | Reads | Writes |
|---|---|---|---|
| `/` | The list: search box, status filter, table of books with a status select per row, "Add book" link | `page.tsx` awaits `searchParams` (`query`, `status`) and passes them to the async server component `BooksTable`, which calls `fetchBooks({ query, status })` from `app/lib/data.ts`. The table sits in `` <Suspense key={`${query}|${status ?? ''}`} fallback={<BooksTableSkeleton />}> ``. | Status select: `updateBookStatus.bind(null, id)` Server Action called from the select's `onChange` inside `startTransition` (not a `<form>`, because React 19 resets a form after its action), `useActionState` for the error and `useOptimistic` for the shown value; `revalidatePath('/')`. |
| `/books/new` | Add book form: title, author, status | none | `createBook` Server Action with `useActionState`; Zod field errors under each field; typed values kept on error; on success `revalidatePath('/')` then `redirect('/')`. |

View state (search text, status filter) lives only in the URL: `/?query=dune&status=reading`.
The search input is debounced 300 ms and uses `router.replace`; the filter is a row of links
("All", "Want to read", "Reading", "Read") that keep the current `query`.

## States (R6)

- **Loading:** `BooksTableSkeleton` while the list streams, and again on each search or filter
  change (the Suspense `key`). The submit button shows "Adding…" and is disabled while pending.
- **Empty:** no books at all → "Your reading list is empty" with an "Add your first book" link;
  no matches → "No books match your search" with a "Clear search and filter" link to `/`.
- **Error:** `app/error.tsx` (and the list's) with a short message and a "Try again" button
  (`reset`); data functions log the real error and throw "Failed to load books". A failed
  status save shows an inline message in the row and the select returns to the saved value; a
  failed add shows the action's `message` above the submit button.

## Out of scope

Edit and delete books, accounts, pagination, sorting controls, searching by author, covers or
external book APIs, a REST API (nothing outside the app calls it).
