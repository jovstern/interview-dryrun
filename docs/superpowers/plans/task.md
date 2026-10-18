# Reading List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js reading list where you list, add, re-status, search and filter books, stored in SQLite.

**Architecture:** Server Components read SQLite through `app/lib/data.ts`; every write is a Server Action in `app/lib/actions.ts` used with `useActionState`; search and filter live in the URL (`?query=&status=`). The list streams inside `<Suspense>` with a skeleton.

**Tech Stack:** Next.js 16.4 App Router (Cache Components, React Compiler), React 19.3, TypeScript strict, Tailwind 4, Zod 4, `better-sqlite3`, `use-debounce`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/task-design.md`

## Global Constraints

- Follow `.claude/skills/stack-conventions/SKILL.md` and `.claude/skills/quality-gates/SKILL.md`. Reads happen in Server Components through `app/lib/data.ts`; writes go through Server Actions in `app/lib/actions.ts` with `useActionState`; view state lives in the URL. A Route Handler, `useEffect` fetch, client-side fetch of the app's own data, or an unjustified `useReducer` is an Important finding.
- **Data, `/`:** `page.tsx` awaits `searchParams`, passes `query` and `status` to async `BooksTable`, which awaits `fetchBooks`; wrapped in `` <Suspense key={`${query}|${status ?? ''}`} fallback={<BooksTableSkeleton />}> ``. Writes: `updateBookStatus.bind(null, id)` + `useActionState` + `useOptimistic`.
- **Data, `/books/new`:** no reads. Write: `createBook` + `useActionState`; `revalidatePath('/')` then `redirect('/')` outside try/catch.
- `better-sqlite3` is synchronous: every function in `data.ts` calls `await connection()` (from `next/server`) before querying (see `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`, "Good to know" on embedded databases). No `'use cache'` on book reads.
- DB file: `process.env.DATABASE_PATH ?? 'data/reading-list.db'`. Tests never open `data/reading-list.db`: unit tests use `:memory:` or a temp file, Playwright uses `data/e2e.db`.
- Statuses are exactly `want_to_read | reading | read`, labels "Want to read" / "Reading" / "Read". Copy strings in this plan are exact.
- No `useReducer`, Route Handler, Context, Zustand, TanStack Query or TanStack Form anywhere: none is needed.
- New dependencies: `better-sqlite3` and dev `@types/better-sqlite3`. Nothing else.
- **Test config change (approved with this plan):** `playwright.config.ts` `webServer` gets `env: { DATABASE_PATH: 'data/e2e.db' }` and its command first runs `rm -f data/e2e.db data/e2e.db-wal data/e2e.db-shm`. Vitest config is not changed: DB test files start with `// @vitest-environment node`.
- E2E tests create books with unique titles (`` `Dune ${Date.now()}` ``) so they do not depend on order or on each other.

## Review Focus

1. Search text with `%` or `_` must match literally, not as a wildcard → `escapeLike` test in M2 Task 3.
2. Whitespace-only title or author must be rejected like an empty one → `createBook` test in M1 Task 3.
3. Typed values must stay in the form after a validation error → component test in M1 Task 4.
4. `?status=bogus` in a shared link shows all books, no crash → `parseStatus` test in M2 Task 1 and e2e in M2 Task 5.
5. A status save that fails must not leave the select showing the unsaved value → component test in M2 Task 2.

---

## Milestone M1 — Add a book and see it in the list (branch `m1-add-and-list`)

Ends with: `/` lists books from SQLite, `/books/new` adds one with validation errors, data survives a restart.
**Demo flow (GIF):** open `/` → "Add book" → submit empty (both errors show) → fill title and author → submit → the book appears in the list.

### Task M1.1: SQLite client, types and `fetchBooks`

**Files:**
- Create: `app/lib/db.ts`, `app/lib/definitions.ts`, `app/lib/data.ts`, `app/lib/data.test.ts`
- Modify: `package.json` (deps), `.gitignore` (add `/data/`)

**Interfaces — Produces:**
- `definitions.ts`: `BOOK_STATUSES = ['want_to_read', 'reading', 'read'] as const`; `type BookStatus = (typeof BOOK_STATUSES)[number]`; `STATUS_LABELS: Record<BookStatus, string>`; `type Book = { id: number; title: string; author: string; status: BookStatus; createdAt: string }`.
- `db.ts`: `openDb(path: string): Database.Database` (creates the parent dir unless `:memory:`, `journal_mode = WAL`, runs the spec's `CREATE TABLE IF NOT EXISTS`); `getDb(): Database.Database` (one instance per process, cached on `globalThis` so dev reloads don't reopen it, path from `DATABASE_PATH`).
- `data.ts`: `fetchBooks(): Promise<Book[]>`, newest first (`ORDER BY created_at DESC, id DESC`), maps `created_at` → `createdAt`; try/catch logs the error and throws `new Error('Failed to load books')`.

- [ ] **Step 1:** `npm install better-sqlite3 && npm install -D @types/better-sqlite3`; add `/data/` to `.gitignore`.
- [ ] **Step 2: Write failing tests** in `app/lib/data.test.ts` (`// @vitest-environment node`; `vi.hoisted(() => { process.env.DATABASE_PATH = ':memory:' })`; `vi.mock('next/server', () => ({ connection: async () => {} }))`; `beforeEach` runs `DELETE FROM books` on `getDb()`):
  - `fetchBooks returns [] when there are no books`
  - `fetchBooks returns books newest first with their fields` — insert "Dune"/"Frank Herbert" then "Emma"/"Jane Austen"; expect `[{ title: 'Emma', author: 'Jane Austen', status: 'want_to_read' }, { title: 'Dune', … }]` (`toMatchObject`), `id` is a number.
  - `openDb keeps books after the database is closed and reopened` — `openDb(tmpFile)` (in `os.tmpdir()`), insert, `close()`, `openDb(tmpFile)` again, row is there; delete the temp file in `afterAll`. (R5)
- [ ] **Step 3:** Run `npx vitest run app/lib/data.test.ts` — expect FAIL (modules missing).
- [ ] **Step 4:** Implement the three files to the interfaces above.
- [ ] **Step 5:** Run the test — PASS; `npm run lint && npm run typecheck`.
- [ ] **Step 6:** Commit `feat: sqlite client and fetchBooks`.

### Task M1.2: The list page

**Files:**
- Create: `app/ui/books/table.tsx`, `app/ui/books/table.test.tsx`, `app/ui/skeletons.tsx`
- Modify: `app/page.tsx`, `app/layout.tsx`
- Delete: `app/ui/greeting-form.tsx`, `e2e/greeting.spec.ts` (the scaffold example; `greet` goes in M1.3)

**Interfaces — Consumes:** `fetchBooks`, `Book`, `STATUS_LABELS`. **Produces:** `BooksTable(): Promise<JSX.Element>` (async server component, in M2 gains props), `BooksList({ books }: { books: Book[] })` (sync presentational component in the same file, used by `BooksTable` and by the test), `BooksTableSkeleton()`.

- [ ] **Step 1: Write failing tests** in `table.test.tsx` against `BooksList`:
  - `shows each book's title, author and status label` — a book with status `reading` renders "Dune", "Frank Herbert", "Reading".
  - `shows the empty state when there are no books` — renders "Your reading list is empty" and a link "Add your first book" to `/books/new`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement. `BooksList` renders a `<table>` with a `<caption className="sr-only">Your books</caption>` and columns Title, Author, Status (a plain status label for now; M2 replaces it with the select). `app/page.tsx`: `metadata.title = 'Books'`, an `<h1>`"Reading list"`</h1>`, a `<Link href="/books/new">`"Add book"`</Link>`, and `<Suspense fallback={<BooksTableSkeleton />}><BooksTable /></Suspense>`. Layout metadata: `{ template: '%s | Reading List', default: 'Reading List' }`.
- [ ] **Step 4:** Tests PASS; open `http://localhost:3000` (dev server already running) and see the empty state with no dev-overlay errors; lint + typecheck.
- [ ] **Step 5:** Commit `feat: list books on the home page`.

### Task M1.3: `createBook` Server Action

**Files:**
- Modify: `app/lib/actions.ts` (replace `greet` and its schema), `app/lib/actions.test.ts` (replace the greet tests)

**Interfaces — Produces:**
```ts
export type CreateBookState = {
  errors?: { title?: string[]; author?: string[]; status?: string[] }
  message?: string | null
  values?: { title: string; author: string; status: string }
}
export async function createBook(prevState: CreateBookState, formData: FormData): Promise<CreateBookState>
```
Zod: `title` trimmed, min 1 `'Enter a title'`, max 200 `'Title must be 200 characters or fewer'`; `author` trimmed, min 1 `'Enter an author'`, max 100 `'Author must be 100 characters or fewer'`; `status` `z.enum(BOOK_STATUSES, { error: 'Choose a status' })`, default `'want_to_read'` when the field is missing. On validation failure return `{ errors, message: 'Fix the highlighted fields.', values }` where `values` are the raw submitted strings. Insert in try/catch → on failure `{ message: 'Could not add the book. Please try again.', values }`. Then `revalidatePath('/')`, `redirect('/')`.

- [ ] **Step 1: Write failing tests** (`// @vitest-environment node`, `:memory:` DB as in M1.1, `vi.mock('next/cache')` and `vi.mock('next/navigation', () => ({ redirect: vi.fn() }))`):
  - `adds a trimmed book and redirects home` — `' Dune '`, `' Frank Herbert '` → row `{ title: 'Dune', author: 'Frank Herbert', status: 'want_to_read' }`, `revalidatePath` called with `'/'`, `redirect` with `'/'`.
  - `saves the chosen status` — `status: 'reading'` → row status `reading`.
  - `requires title and author` — empty strings → `errors.title` `['Enter a title']`, `errors.author` `['Enter an author']`, no row, `values` equals the input.
  - `treats whitespace-only fields as empty` — `'   '` → same errors.
  - `rejects a 201-character title` → `['Title must be 200 characters or fewer']`.
  - `rejects an unknown status` → `errors.status` `['Choose a status']`.
- [ ] **Step 2:** Run `npx vitest run app/lib/actions.test.ts` — FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; lint + typecheck.
- [ ] **Step 5:** Commit `feat: createBook server action`.

### Task M1.4: The add-book page and form

**Files:**
- Create: `app/books/new/page.tsx`, `app/ui/books/create-form.tsx`, `app/ui/books/create-form.test.tsx`

**Interfaces — Consumes:** `createBook`, `CreateBookState`, `BOOK_STATUSES`, `STATUS_LABELS`. **Produces:** `CreateBookForm()` (client).

- [ ] **Step 1: Write failing tests** (mock `@/app/lib/actions` so `createBook` resolves to a given state):
  - `shows field errors linked to their inputs` — after submitting with the mock returning both errors, "Enter a title" is inside `#title-error` and the Title input has `aria-describedby="title-error"` and `aria-invalid="true"`; same for author.
  - `keeps typed values after a validation error` — mock returns `values: { title: 'Dune', author: '', status: 'read' }`; after submit, Title shows "Dune" and Status shows "Read".
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement following the scaffold's form pattern (`git show main:app/ui/greeting-form.tsx`, deleted in M1.2): labelled inputs Title, Author (both `required`, `maxLength`), a Status `<select>` defaulting to "Want to read", `defaultValue={state.values?.…}` on each field, the form-level `state.message` in an `aria-live` region, submit button "Add book" / "Adding…" disabled while pending, and a "Cancel" `<Link href="/">`. Page: `metadata.title = 'Add book'`, `<h1>`"Add a book"`</h1>`.
- [ ] **Step 4:** PASS; try it at `http://localhost:3000/books/new`; lint + typecheck.
- [ ] **Step 5:** Commit `feat: add-book page`.

### Task M1.5: E2E for adding a book

**Files:**
- Create: `e2e/add-book.spec.ts`
- Modify: `playwright.config.ts` (the approved `webServer` change in Global Constraints)

- [ ] **Step 1: Write the tests:**
  - `adds a book and shows it in the list` — `/` → click "Add book" → submit empty → "Enter a title" and "Enter an author" visible → fill Title `` `Dune ${Date.now()}` ``, Author "Frank Herbert" → "Add book" → URL is `/` and a row with that title and "Want to read" is visible → `page.reload()` → row still visible. Short `page.waitForTimeout(600)` after the errors appear and after the row appears (demo readability).
- [ ] **Step 2:** `npm run e2e` — PASS (the config change makes it use `data/e2e.db`; confirm `data/reading-list.db` is untouched by its modified time).
- [ ] **Step 3:** Commit `test: e2e for adding a book`.

---

## Milestone M2 — Change status, search and filter (branch `m2-status-search-filter`)

Ends with: R3 and R4 working.
**Demo flow (GIF):** list with several books → change one row's status to "Read" → type in search → click the "Reading" filter → reload (URL `/?query=…&status=reading` keeps both) → clear.

### Task M2.1: `updateBookStatus` Server Action

**Files:** Modify `app/lib/actions.ts`, `app/lib/actions.test.ts`; Create `app/lib/utils.ts`, `app/lib/utils.test.ts`

**Interfaces — Produces:** `utils.ts`: `parseStatus(value: unknown): BookStatus | undefined` (a `BOOK_STATUSES` member or `undefined`; arrays → `undefined`).
```ts
export type StatusState = { message?: string | null }
export async function updateBookStatus(id: number, prevState: StatusState, formData: FormData): Promise<StatusState>
```
Validates `status` with `z.enum(BOOK_STATUSES)` (`'Choose a status'`). `UPDATE … WHERE id = ?` in try/catch → on throw `{ message: 'Could not save the status. Please try again.' }`; `changes === 0` → `{ message: 'This book no longer exists.' }`. Success: `revalidatePath('/')`, return `{ message: null }` (no redirect).

- [ ] **Step 1: Tests:** `parseStatus` returns `'reading'` for `'reading'`, `undefined` for `'bogus'`, `undefined`, `['read','reading']`; `changes a book's status` (row becomes `read`, `revalidatePath('/')`); `rejects an unknown status` (row unchanged, message `'Choose a status'`); `reports a missing book` (id 999 → `'This book no longer exists.'`).
- [ ] **Step 2–4:** FAIL → implement → PASS; lint + typecheck.
- [ ] **Step 5:** Commit `feat: updateBookStatus server action`.

### Task M2.2: Status select in each row

**Files:** Create `app/ui/books/status-select.tsx`, `app/ui/books/status-select.test.tsx`; Modify `app/ui/books/table.tsx`

**Interfaces — Produces:** `StatusSelect({ id, title, status }: { id: number; title: string; status: BookStatus })` (client).

Approach: `const [state, formAction] = useActionState(updateBookStatus.bind(null, id), { message: null })`; `const [shown, setShown] = useOptimistic(status)`; `<form action={(fd) => { const next = parseStatus(fd.get('status')); if (next) setShown(next); formAction(fd) }}>` with `<select name="status" value={shown} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label={`Status of ${title}`}>`; `state.message` in an `aria-live` `<p>` under it. On failure the optimistic value drops back to the `status` prop on its own.

- [ ] **Step 1: Tests** (mock the action): `submits the chosen status` (choosing "Read" calls the action with `id` and FormData `status=read`); `shows the error and the saved status when saving fails` (mock returns `{ message: 'Could not save the status. Please try again.' }` → message visible, select value back to `reading`).
- [ ] **Step 2–4:** FAIL → implement, use it in `BooksList`'s Status column → PASS; check in the browser; lint + typecheck.
- [ ] **Step 5:** Commit `feat: change a book's status from the list`.

### Task M2.3: Filtered `fetchBooks`

**Files:** Modify `app/lib/data.ts`, `app/lib/data.test.ts`, `app/lib/utils.ts`, `app/lib/utils.test.ts`

**Interfaces — Produces:**
- `utils.ts`: `escapeLike(text: string): string` (escapes `\`, `%`, `_` with `\`).
- `data.ts`: `fetchBooks(filters: { query?: string; status?: BookStatus } = {}): Promise<Book[]>` — `title LIKE ? ESCAPE '\'` with `%${escapeLike(query.trim())}%` when `query` is non-empty; `status = ?` when given.

- [ ] **Step 1: Tests:** `escapeLike('50%_off\\')` → `'50\\%\\_off\\\\'`; `fetchBooks` — `matches part of the title ignoring case` (`'dun'` finds "Dune"), `does not search author`, `filters by status`, `combines query and status`, `treats % literally` ("100% Dune" found by `'%'`, "Dune" not).
- [ ] **Step 2–4:** FAIL → implement → PASS; lint + typecheck.
- [ ] **Step 5:** Commit `feat: search and filter books in the database`.

### Task M2.4: Search box, status filter and URL wiring

**Files:** Create `app/ui/search.tsx`, `app/ui/search.test.tsx`, `app/ui/books/status-filter.tsx`, `app/ui/books/status-filter.test.tsx`; Modify `app/page.tsx`, `app/ui/books/table.tsx`

**Interfaces — Produces:** `Search({ placeholder }: { placeholder: string })` (client, course pattern: `useSearchParams`, `usePathname`, `useRouter().replace`, `useDebouncedCallback` 300 ms, uncontrolled `defaultValue`, empty value deletes `query`); `StatusFilter()` (client; links "All", "Want to read", "Reading", "Read" whose `href` keeps the current `query` and sets/deletes `status`; the active one has `aria-current="page"`); `BooksTable({ query, status }: { query: string; status?: BookStatus })`.

Page: `props.searchParams` awaited inside an async component under `<Suspense>` (Cache Components requires runtime data inside Suspense — follow the build error's fix if it names another); `query = searchParams.query ?? ''`, `status = parseStatus(searchParams.status)`; results `<Suspense key={query + (status ?? '')} fallback={<BooksTableSkeleton />}>`. `Search` and `StatusFilter` use `useSearchParams`, so they sit inside `<Suspense>` too.

- [ ] **Step 1: Tests** (mock `next/navigation`): Search — `writes the query to the URL after typing` (fake timers, 300 ms → `replace('/?query=dune')`), `removes query when cleared`, `keeps status` (`?status=read` + type → `/?status=read&query=dune`). StatusFilter — `marks the current status` and `keeps the query in each link` (`?query=dune` → "Reading" href `/?query=dune&status=reading`, "All" href `/?query=dune`).
- [ ] **Step 2–4:** FAIL → implement and wire into the page → PASS; check `/?query=du&status=reading` in the browser; lint + typecheck.
- [ ] **Step 5:** Commit `feat: search and status filter in the URL`.

### Task M2.5: E2E for status, search and filter

**Files:** Create `e2e/status-search-filter.spec.ts`

- [ ] **Step 1: Tests** (each creates its own uniquely named books through `/books/new` in a helper):
  - `changes a book's status and keeps it after reload`.
  - `search and filter survive a reload and work from a shared link` — create "Alpha <id>" (reading) and "Beta <id>" (read); type the id-specific "Alpha" title → only Alpha visible; click "Reading" → URL has `query=` and `status=reading`; reload → same results, search box still holds the text; open the URL in a new page → same results.
  - `ignores an unknown status in the URL` — `/?status=bogus` shows the list and "All" is current.
- [ ] **Step 2:** `npm run e2e` — PASS.
- [ ] **Step 3:** Commit `test: e2e for status, search and filter`.

---

## Milestone M3 — States, accessibility, README (branch `m3-polish`)

Ends with: R6 complete, README shipped.
**Demo flow (GIF):** search for something with no match → "No books match your search" → "Clear search and filter" → list returns; then the add form showing "Adding…".

### Task M3.1: Empty states for no books and no matches

**Files:** Modify `app/ui/books/table.tsx`, `app/ui/books/table.test.tsx`

`BooksList` gains `filtered: boolean`; when `books` is empty and `filtered`, render "No books match your search" and a `<Link href="/">`"Clear search and filter"`</Link>`; otherwise the M1 empty state.

- [ ] **Step 1–4:** Test `shows the no-match state when filtered` → FAIL → implement (`BooksTable` passes `filtered = query !== '' || status !== undefined`) → PASS.
- [ ] **Step 5:** Commit `feat: no-match empty state`.

### Task M3.2: Error boundaries

**Files:** Create `app/error.tsx`, `app/error.test.tsx`

Client component `{ error, reset }` (check the installed `error.md` doc for the current prop names): `<h2>`"Something went wrong"`</h2>`, the text "We couldn't load your books.", a "Try again" button calling `reset`, and `console.error(error)` in a `useEffect` (syncing with something outside React).

- [ ] **Step 1–4:** Test `renders the message and retries` (clicking "Try again" calls `reset`) → FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat: error state`.

### Task M3.3: Loading skeleton and accessibility pass

**Files:** Modify `app/ui/skeletons.tsx`, `app/page.tsx`, `app/ui/books/*.tsx`, `app/layout.tsx`; Create `app/books/new/loading.tsx` only if navigation shows a blank gap

- Skeleton mirrors the table (5 rows, `aria-busy="true"`, `aria-label="Loading books"`); visible focus rings on every control; status colours carry text too (never colour alone); `<main>` landmark and a skip-free single `h1` per page; labels on search ("Search books by title") and filter (`<nav aria-label="Filter by status">`).
- [ ] **Step 1:** Test in `table.test.tsx`: `skeleton is announced as loading` (`getByLabelText('Loading books')` has `aria-busy`).
- [ ] **Step 2–3:** Implement → PASS; tab through `/` and `/books/new` in the browser.
- [ ] **Step 4:** Commit `feat: loading skeleton and accessibility`.

### Task M3.4: Seed script and README

**Files:** Create `scripts/seed.mjs`; Modify `package.json` (`"seed": "node scripts/seed.mjs"`), `README.md`; Delete `scripts/db-check.mjs` and the `postgres` dependency (unused Neon leftovers)

- Seed inserts 6 sample books across all statuses into `DATABASE_PATH ?? data/reading-list.db` only when the table is empty (prints "Seeded 6 books" or "Already has books, nothing to do").
- README: what it is; run it (`npm install`, `npm run seed` optional, `npm run dev`, no env vars needed, `DATABASE_PATH` optional); tests (`npm run check`, `npm run e2e`, which DB each uses); how it's built (reads, writes, URL state, `connection()`); decisions and trade-offs; assumptions (copy from spec); demo GIFs of M1–M3 from the PRs; next steps (pagination, edit/delete, author search, leftover review minors).
- [ ] **Step 1:** Run `npm run seed` twice against a temp `DATABASE_PATH` — first prints "Seeded 6 books", second "Already has books, nothing to do".
- [ ] **Step 2:** `npm run check` and `npm run e2e` — PASS.
- [ ] **Step 3:** Commit `docs: README and seed script`.
