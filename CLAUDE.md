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

## Hard rules

- Follow `.claude/skills/stack-conventions/SKILL.md` (the Next.js Learn course patterns) and
  `.claude/skills/quality-gates/SKILL.md`.
- Never bypass a hook or check; never skip or delete a failing test.
- Ask before changing lint, TypeScript, Next.js or test configuration.
