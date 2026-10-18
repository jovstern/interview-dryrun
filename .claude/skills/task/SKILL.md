---
name: task
description: Build a timed assignment end to end in this one session - read the assignment, ask one batch of questions, get one approval on a spec and plan, build it milestone by milestone with Superpowers subagents, each ending in a reviewed PR with a demo GIF that the user merges, and finish with a README. Optimised for speed and quality, not tokens.
argument-hint: "[assignment text, file path or URL]"
disable-model-invocation: true
---

# /task

Live, timed work (about 2–3 hours). Quality and wall-clock time come first; tokens do not
matter. Everything happens in **this one session, on Opus**: no `/clear`, no model switches,
no GitHub issues. The user stays in control through one approval of the plan and by merging
each milestone's pull request (repo: `jovstern/interview-dryrun`, `main` is protected).

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
ones: what to cut if time runs short, ambiguous requirements, whether to rename the GitHub
repo to match the assignment (`gh repo rename`). Everything else: decide, and list it as an
assumption.

**The database is always one of the questions; never pick it yourself.** Unless the
assignment names one, offer these options (see "Databases" in CLAUDE.md), each with a
one-line trade-off for this assignment, and recommend one with the reason:
- Neon Postgres (not available in this dry run; list it as unavailable),
- SQLite through `better-sqlite3` (local file, runs anywhere without credentials),
- local MongoDB,
- in-memory / JSON file (only if the assignment needs no real persistence).
If the assignment names a database, still confirm it in the question. Nothing touches a
database, `.env` or a database package before the user answers.

## 3. Spec and plan, one approval (target: 15 minutes)

Use `superpowers:brainstorming` (architectural path) and `superpowers:writing-plans` with
these project overrides, which take precedence over their defaults:

- No more questions and no section-by-section approval: the batch above was the questions.
- Write the spec to `docs/superpowers/specs/task-design.md`, short: requirements checklist,
  assumptions, data model, routes, and for each screen how it reads data and how it writes
  (from `stack-conventions`), and what is out of scope.
- Write the plan to `docs/superpowers/plans/task.md`, split into **milestones** (M1, M2, …).
  M1 is the thinnest end-to-end version of the core flow (real data, real write, one e2e
  test), done in about the first hour. Later milestones add the remaining requirements in
  priority order; the last is polish (loading/error/empty states, accessibility, README).
  Each milestone has at most 6 tasks, ends with the app working, and names the one user
  flow its demo GIF shows.
- Global Constraints repeat the stack rules that matter for this task, including the Data
  line per screen. Any `useReducer`, Route Handler, Context, Zustand, TanStack Query or
  TanStack Form needs a line naming where and why.
- Then show the user, in chat, a summary of at most 20 lines: requirements → milestones, the
  key decisions, and the assumptions. **Wait for one approval.** Their changes are applied
  directly, without a second full review round.

`main` is protected, so create the M1 branch first (`git switch -c m1-<slug>`) and commit the
spec and plan there (`docs: spec and plan`); they arrive on `main` with the first PR.

## 4. Build, one milestone at a time

Use `superpowers:subagent-driven-development` on the plan, with these overrides:

- **Run it per milestone:** hand it only the current milestone's tasks. Each milestone is its
  own branch `mN-<slug>`, created from an up-to-date `main` (M1's already exists).
- **Models, quality first:** implementers on Sonnet only when the task text contains the
  complete code; otherwise Opus. Task reviewers on Sonnet; the milestone review on Opus.
  Never Haiku.
- Every implementer and reviewer brief carries, verbatim: "Follow
  `.claude/skills/stack-conventions/SKILL.md` and `.claude/skills/quality-gates/SKILL.md`.
  Reads happen in Server Components through `app/lib/data.ts`; writes go through Server
  Actions in `app/lib/actions.ts` with `useActionState`; view state lives in the URL. A Route
  Handler, `useEffect` fetch, client-side fetch of the app's own data, or an unjustified
  `useReducer` is an Important finding."
- One commit per task on the milestone branch. No worktrees.

### End of each milestone: review, GIF, PR, wait

1. **Review:** the milestone's whole-diff review on Opus, using Superpowers' final-review
   step (`requesting-code-review`'s `code-reviewer.md`) on `git merge-base main HEAD..HEAD`,
   pointed at the ledger's deferred minors. One fix dispatch for its findings, one scoped
   re-review.
2. **Gates:** both gates from `quality-gates` green.
3. **Demo:** the `pr-demo` skill with the milestone number, recording the flow the plan names.
4. **PR:** push the branch and `gh pr create --base main --title "M<N>: <name>"` with this
   body (written to a temp file, `--body-file`):
   ```
   ## What you can do now
   <3–5 bullets, user-facing>

   ## Demo
   ![M<N> demo](<URL printed by make-demo.sh>)

   ## Review
   <the milestone review's verdict; each finding, how it was fixed or why it stands;
   minors left for later>

   ## Decisions made during the build
   <every "Ruling:" line from this milestone, with what it costs if wrong; "None" if empty>

   ## Checks
   <commands run and their results: npm run check, npm run e2e>

   ## Requirements covered
   <the spec's checklist items this milestone completes>
   ```
5. **Stop and wait.** Post at most 5 lines: the PR link, what to look at in the GIF, what
   to click at `localhost:3000`, time spent so far, and what the next milestone is. Do not
   start the next milestone. While waiting, do nothing that changes files.
6. **When the user replies:** check `gh pr view <N> --json state,reviews,comments`.
   - Comments or requested changes → fix them on the same branch, rerun the gates, push,
     reply to each comment, update the PR body if the demo changed, and wait again.
   - `MERGED` → `git switch main && git pull --ff-only`, then start the next milestone.
   - Not merged and no comments → ask whether to wait or continue on top of it.

If time is running short (the user says so, or about 2 hours have passed), say so: the
current milestone ends cleanly with its PR, and the next one becomes the polish milestone.

## 5. Finish

The last milestone includes `README.md`: what it is, how to run it (env vars, database
setup, seed, `npm run dev`, tests), how it is built (data reads, writes, URL state), the
decisions and trade-offs with reasons, assumptions, the demo GIFs of each milestone, and what
you would do next with more time (leftover review minors go here). It ships through its PR
like every milestone.

After the last merge: final message with the requirement checklist (✅ / ❌ each), every
ruling made across milestones, and the links to the repo and each PR.
