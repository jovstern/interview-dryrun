# interview-task

A timed assignment built live with `/task` (Next.js App Router). The assignment, spec and
plan live in `docs/superpowers/`.

@AGENTS.md

## Commands

- `npm run dev` — start the app at http://localhost:3000
- `npm run check` — format, lint, typecheck, unit tests, build
- `npm run e2e` — browser tests (recorded)

## How work happens

- `/task` runs the whole job in one session on Opus: questions, spec and plan, build, README.
- Superpowers preferences for this project (they override the skills' defaults):
  - Brainstorming: one batch of questions, then one approval of spec and plan together.
  - No git worktrees. Working directly on `main` is approved; one commit per task.
  - Subagent-driven development continues from slice to slice without stopping; it posts a
    short status after each slice.
  - When finishing, do not show the merge/PR menu: commit on `main` and push if the user
    chose GitHub.

## This machine

- **Databases:** the user chooses the database in `/task`'s question round. Never pick one
  or connect to one before they answer. The options available on this machine:
  - **Neon Postgres:** Vercel Storage resource `interview-task-neon`, Frankfurt, empty.
    `POSTGRES_URL` is in `.env` (git-ignored; never print, read or commit it). Use it as the
    Next.js course does: the `postgres` package (installed), one client in `app/lib/db.ts`
    (`postgres(process.env.POSTGRES_URL!, { ssl: 'require' })`), tagged-template SQL in
    `app/lib/data.ts` and `app/lib/actions.ts`, and a seed script.
    `node --env-file=.env scripts/db-check.mjs` checks that it answers.
  - **SQLite** through `better-sqlite3`: tested here, no setup, and runs on anyone's machine.
  - **MongoDB:** runs locally at `mongodb://localhost:27017` (Homebrew service).
  - There is no local Postgres and no Docker.
- Tests never drop or wipe the app's data: they use their own database file, schema or
  table prefix, and clean up after themselves.
- `gh` is logged in as `jovstern`.

## Hard rules

- Follow `.claude/skills/stack-conventions/SKILL.md` (the Next.js Learn course patterns) and
  `.claude/skills/quality-gates/SKILL.md`.
- Never bypass a hook or check; never skip or delete a failing test.
- Ask before changing lint, TypeScript, Next.js or test configuration.
