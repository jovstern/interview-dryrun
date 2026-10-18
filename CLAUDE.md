# interview-dryrun

A timed assignment built live with `/task` (Next.js App Router). The assignment, spec and
plan live in `docs/superpowers/`.

@AGENTS.md

## Commands

- `npm run dev` — start the app at http://localhost:3000
- `npm run check` — format, lint, typecheck, unit tests, build
- `npm run e2e` — browser tests (recorded)

## How work happens

- `/task` runs the whole job in one session on Opus: questions, spec and plan, then one
  milestone at a time. Each milestone is a branch `mN-<slug>` and a pull request on
  `jovstern/interview-dryrun` with a review section and a demo GIF. **The user merges every
  PR; Claude waits for the merge before starting the next milestone.**
- Superpowers preferences for this project (they override the skills' defaults):
  - Brainstorming: one batch of questions, then one approval of spec and plan together.
  - No git worktrees: work in place on the milestone branch; one commit per task.
  - Subagent-driven development runs one milestone's tasks without stopping, then the
    milestone review on Opus.
  - When finishing a milestone, do not show the merge/PR menu: always push and open the PR,
    then stop.

## This machine

- **Databases:** the user chooses the database in `/task`'s question round. Never pick one
  or connect to one before they answer. The options available on this machine:
  - **Neon Postgres: not available in this dry run.** It is reserved for the real interview
    folder; offer it in the question as unavailable so the question looks the same.
  - **SQLite** through `better-sqlite3`: tested here, no setup, and runs on anyone's machine.
  - **MongoDB:** runs locally at `mongodb://localhost:27017` (Homebrew service).
  - There is no local Postgres and no Docker.
- Tests never drop or wipe the app's data: they use their own database file, schema or
  table prefix, and clean up after themselves.
- `gh` is logged in as `jovstern`.

## Hard rules

- Follow `.claude/skills/stack-conventions/SKILL.md` (the Next.js Learn course patterns) and
  `.claude/skills/quality-gates/SKILL.md`.
- Never push to `main` or merge a PR. Never bypass a hook or check; never skip or delete a
  failing test.
- Ask before changing lint, TypeScript, Next.js or test configuration.
