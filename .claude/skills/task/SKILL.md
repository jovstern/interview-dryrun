---
name: task
description: Build a timed assignment end to end in this one session - read the assignment, ask one batch of questions, get one approval on a spec and plan, build it slice by slice with Superpowers subagents, and finish with a README. Optimised for speed and quality, not tokens.
argument-hint: "[assignment text, file path or URL]"
disable-model-invocation: true
---

# /task

Live, timed work (about 2–3 hours). Quality and wall-clock time come first; tokens do not
matter. Everything happens in **this one session, on Opus**: no `/clear`, no model switches,
no GitHub issues or PRs. The user stays in control through one approval and short status
lines they can interrupt.

The app is already scaffolded (Next.js, all gates green). Read `CLAUDE.md`,
`.claude/skills/stack-conventions/SKILL.md` and `.claude/skills/quality-gates/SKILL.md` first.

## 1. Start (2 minutes)

1. Start the dev server in the background (`npm run dev`) so the user can watch the app at
   `http://localhost:3000` as it grows. Reuse it if `.next/dev/lock` shows one running.
2. Get the assignment: `$ARGUMENTS` as text, a file to read, or a URL to fetch. If nothing
   was given, ask the user to paste it.
3. If the assignment comes with its own repo or starter, inspect it and follow its structure
   and tooling wherever it conflicts with ours; keep our rules for everything else.

## 2. One round of questions (target: under 5 minutes of the user's time)

Read the assignment twice. List every requirement as a checklist (quote the assignment's
words). Then ask **one** `AskUserQuestion` call with at most 4 questions, only those whose
answer changes what gets built. Each question puts your recommended option first. Typical
ones: which database (default: the Neon Postgres in `.env`, see CLAUDE.md), what to cut if time runs short, ambiguous requirements,
whether to push to GitHub at the end. Everything else: decide, and list it as an assumption.

## 3. Spec and plan, one approval (target: 15 minutes)

Use `superpowers:brainstorming` (architectural path) and `superpowers:writing-plans` with
these project overrides, which take precedence over their defaults:

- No more questions and no section-by-section approval: the batch above was the questions.
- Write the spec to `docs/superpowers/specs/task-design.md`, short: requirements checklist,
  assumptions, data model, routes, and for each screen how it reads data and how it writes
  (from `stack-conventions`), and what is out of scope.
- Write the plan to `docs/superpowers/plans/task.md`, split into **slices**. Slice 1 is the
  thinnest end-to-end version of the core flow (real data, real write, one e2e test), done
  in about the first hour. Later slices add the remaining requirements in priority order;
  the last slice is polish (loading/error/empty states, accessibility, README). Each slice
  has at most 6 tasks and ends with the app working.
- Global Constraints repeat the stack rules that matter for this task, including the Data
  line per screen. Any `useReducer`, Route Handler, Context, Zustand, TanStack Query or
  TanStack Form needs a line naming where and why.
- Then show the user, in chat, a summary of at most 20 lines: requirements → slices, the
  key decisions, and the assumptions. **Wait for one approval.** Their changes are applied
  directly, without a second full review round.

Commit the spec and plan (`docs: spec and plan`).

## 4. Build, slice by slice

Use `superpowers:subagent-driven-development` on the plan, with these overrides:

- **Models, quality first:** implementers on Sonnet only when the task text contains the
  complete code; otherwise Opus. Task reviewers on Sonnet; the final whole-branch review on
  Opus. Never Haiku.
- Every implementer and reviewer brief carries, verbatim: "Follow
  `.claude/skills/stack-conventions/SKILL.md` and `.claude/skills/quality-gates/SKILL.md`.
  Reads happen in Server Components through `app/lib/data.ts`; writes go through Server
  Actions in `app/lib/actions.ts` with `useActionState`; view state lives in the URL. A Route
  Handler, `useEffect` fetch, client-side fetch of the app's own data, or an unjustified
  `useReducer` is an Important finding."
- Work directly on `main` (approved for this project); one commit per task.
- **At the end of each slice:** run both gates, then post a status of at most 4 lines: what
  works now, what to click at `localhost:3000`, time spent, what is next. Then **continue
  with the next slice without waiting**; the user interrupts if they want a change.
- If time is running short (the user says so, or about 2 hours have passed), say so, finish
  the current slice cleanly, and skip to the polish slice.

## 5. Finish

1. The final whole-branch review (Opus) runs as Superpowers defines it. Fix its findings once.
2. Both gates green, `npm run build` clean.
3. Write `README.md`: what it is, how to run it (env vars, database setup, seed, `npm run
   dev`, tests), how it is built (data reads, writes, URL state), the decisions and
   trade-offs with reasons, assumptions, and what you would do next with more time (deferred
   review findings go here). Add the demo GIF with the `pr-demo` skill only if a GitHub
   remote exists and there is time.
4. Commit. If the user chose GitHub: push to the repo they named, or
   `gh repo create <name> --public --source . --push`.
5. Final message: the requirement checklist with ✅ / ❌ for each, the "Rulings I made" list,
   and the repo link.
