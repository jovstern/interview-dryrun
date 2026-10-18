# Reading List

A single-user reading list built with Next.js 16 (App Router) and SQLite. You can see your
books, add one, move it between "Want to read", "Reading" and "Read", and find books by title
and status through a link you can share.

## Requirements

- ✅ **R1** "A page listing books with title, author and status (want to read / reading / read)."
- ✅ **R2** "Add a book with a form; title and author are required, with clear validation errors."
- ✅ **R3** "Change a book's status from the list."
- ✅ **R4** "Search books by title and filter by status; the search and filter must survive a page
  refresh and be shareable as a link."
- ✅ **R5** "Data must persist between server restarts."
- ✅ **R6** "Show sensible loading, empty and error states."

## Run it

Needs Node 24 or newer.

```bash
npm install
npm run seed   # optional: adds 6 sample books, only if the list is empty
npm run dev    # http://localhost:3000
```

- No environment variables are needed. `DATABASE_PATH` is optional and defaults to
  `data/reading-list.db`.
- The database file and its table are created on first use, so there is no setup step.
- `better-sqlite3` ships prebuilt binaries for macOS, Linux and Windows on x64 and arm64, so
  `npm install` doesn't compile anything on those platforms.

## Tests

- `npm run check` runs format, lint, typecheck, unit tests (Vitest) and `next build`. Unit tests
  use an in-memory SQLite database (`:memory:`).
- `npm run e2e` runs Playwright against a production build on port 3100, using `data/e2e.db`,
  which is deleted at the start of each run. Your `data/reading-list.db` is never touched.

> Playwright reuses any server already listening on :3100, so make sure that port is free
> before running `npm run e2e`.

## How it's built

**Reads.** Async Server Components call `app/lib/data.ts`; there is no API layer. Each data
function calls `await connection()` first: `better-sqlite3` is synchronous, and with Cache
Components on, a synchronous query would otherwise run during prerendering. The list streams
inside `<Suspense>` with a skeleton fallback.

**Writes.** Server Actions in `app/lib/actions.ts` validate with Zod, report errors through
`useActionState`, then call `revalidatePath('/')` and, for a new book, `redirect('/')`. The
add form keeps what you typed when validation fails. The status select in each row calls its
bound action (`updateBookStatus.bind(null, id)`) from `onChange` inside `startTransition`, with
`useOptimistic` so the new value shows at once. It isn't a `<form>` because React 19 resets a
form after its action, which snapped the select back to its first option.

**URL state.** Search and filter live only in the URL: `/?query=dune&status=reading`. The
search box is debounced 300 ms and updates the URL with `router.replace`; the filter is a row of
links that keep the current query. The results' `<Suspense>` is keyed on query and status, so
each change shows the skeleton again while the new results stream in.

**States.**

- Loading: a table skeleton while the list streams; "Adding…" on the disabled submit button.
- Empty: "Your reading list is empty" with a link to add a first book.
- No match: "No books match your search" with a link that clears search and filter.
- Error: `app/error.tsx` shows "Something went wrong" with a "Try again" button (`retry`).
- Inline errors: a failed add shows the action's message above the submit button; a failed
  status save shows a message in the row, and the select goes back to the saved value.

## Decisions and trade-offs

- **SQLite (`better-sqlite3`), the user's choice.** One local file, no server or account,
  runs on any machine with `npm install`, and data survives restarts (R5).
- **No API layer.** Nothing outside the app reads the data, so Server Components query the
  database directly and Server Actions handle writes. A REST API would be extra code with no
  caller.
- **The status select saves from `onChange`, not from a `<form>`.** See "Writes" above. The
  cost: changing a status needs JavaScript.
- **`retry` rather than `reset` in `error.tsx`.** The installed Next 16.4 docs recommend
  `retry`, which re-fetches the server data and re-renders the segment; `reset` only re-renders.
- **Light theme only.** All components use light colours, so the dark-mode CSS from the
  starter was removed rather than half-supported.
- **Search uses `LIKE` with an escape character.** `%` and `_` in a search match literally.
  SQLite's `LIKE` ignores case for ASCII letters only, so "émile" won't find "Émile".
- **No pagination.** A personal list stays small.

## Assumptions

- No accounts: one shared list.
- A new book starts as "want to read"; the add form also lets you pick a status.
- Title max 200 characters, author max 100, both trimmed; whitespace-only counts as empty.
- Search matches a part of the title, ignoring case; author is not searched (the assignment
  says "by title").
- An unknown `status` value in the URL is ignored (shows all), not an error.
- List order: newest first.
- Duplicates are allowed (two editions of a book are real).
- No pagination: a personal list stays small.
- `npm run seed` adds a few sample books for the demo; the app starts empty without it.

## Demos

The work was built in three milestones, each a reviewed pull request.

### M1: list, add a book, persistence ([PR #1](https://github.com/jovstern/interview-dryrun/pull/1))

![M1 demo](https://github.com/jovstern/interview-dryrun/blob/pr-media/m01/demo.gif?raw=true)

### M2: status change, search and filter ([PR #2](https://github.com/jovstern/interview-dryrun/pull/2))

![M2 demo](https://github.com/jovstern/interview-dryrun/blob/pr-media/m02/demo.gif?raw=true)

### M3: states, accessibility, seed and README

![M3 demo](https://github.com/jovstern/interview-dryrun/blob/pr-media/m03/demo.gif?raw=true)

## What I'd do next

- Pagination.
- Edit and delete books.
- Search by author as well as title.
- Unicode-aware case-insensitive search, using a normalised lowercase title column.
- A dark theme using Tailwind `dark:` variants.
- A no-JavaScript fallback for the status select.
- Shared button and focus-ring styles, such as a global `:focus-visible` rule.
- A leftover minor: on an empty database, a whitespace-only search (`?query=%20`) shows "No
  books match your search" instead of the empty state.
