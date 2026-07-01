---
name: tasks
description: Author a well-formed backlog task card for the tasks/ kanban board. Use when adding work to the queue, splitting a feature into tasks, or when the user says "write a task", "add to the backlog", "create a task card", or "/tasks". Produces a single JSON file per task that validates against task.schema.json and gives the agent loop just enough to implement and self-verify one unit of work.
---

# Writing a backlog task

The autonomous loop (`run-backlog.sh`) builds the board **one card at a time, each in a fresh
context window**. Your job here is to write a card that gives that fresh-context run *just enough*
to implement the work and to **prove it's done on its own** — no more, no less.

A card is one JSON file validating against [`task.schema.json`](./task.schema.json). Start from
[`template.task.json`](./template.task.json); [`example.task.json`](./example.task.json) is a filled-in
reference.

## The board convention (don't break it)

- Cards live under `tasks/<lane>/` where lane ∈ `backlog | in_progress | blocked | done`.
- **The lane (directory) is the status.** The loop moves a card between lanes with `git mv`.
- **Filename is `<id>.json` and MUST equal the `id` field.** New cards go in `tasks/backlog/`.
- Execution order within a lane is lexical by filename, so the **3-digit prefix orders the work**.
  Pick the next free prefix (e.g. after `002-*`, use `003-`).

## Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `id` | ✓ | `NNN-kebab-slug`, equals the filename. Ordering prefix + slug. |
| `title` | ✓ | One-line summary; used in commit messages and progress output. |
| `goal` | ✓ | The end state in one tight paragraph — *what is true when done*, outcome not steps. |
| `acceptance` | ✓ | `string[]`, the pass/fail contract. Each item verifiable by a real command/browser check whose **output the run pastes**. |
| `depends_on` | | ids that must be in `tasks/done/` first. The selector skips this card until they are. Default `[]`. |
| `skills` | | Claude Code skill names to load (via the Skill tool) before implementing, e.g. `frontend-design`. Default `[]`. |
| `model` | | Anthropic model passed to `claude --model` for this task. Aliases (`opus`, `sonnet`, `haiku`, `fable`); see the schema enum. Default `opus`. |
| `context` | | Background/approach/pointers that are *not* pass/fail checks (e.g. "resolve app root from JOURNAL.md"). |
| `tests` | | Tests the run must **author and leave green**, beyond the acceptance checks. Default `[]`. |

There is no status/notes field: a card's outcome is its **lane** (`done/` vs not). Anything a future
run needs to know goes in `JOURNAL.md`, not the card.

## How to write good acceptance criteria

This is the whole game — a vague check gets a task **blocked**, a checkable one gets it **done**.

- **Every item must be provable by a command or a browser observation.** Prefer
  `Run \`bun run build\` — exits 0`, `src/app/page.tsx exists`, `curl -si localhost:3000 returns 200`
  over `the build works` or `the page looks right`.
- **Keep steps out of acceptance.** *How* to do the work goes in `context`; acceptance is only *what
  must be true* at the end.
- **One check per item.** Don't bundle three assertions into one string.
- **Browser checks** use the `mcp__claude-in-chrome__` tools — say what to observe and to screenshot.
- If a check can't be made unambiguous, that's a signal to split the task or add `context`.

## `skills` vs `tests`

- `skills` = capabilities the run **loads** to do the work well (design skills, component authoring).
- `tests` = verification the run **writes into the codebase** and must leave passing. Use for behavior
  worth locking in (a route returns 200, a validation error fires). Not every task needs them.

The loop **always runs the full test suite** (`bun run test` when `package.json` defines a `test`
script) as a standing gate on every task — you don't need to restate that in `acceptance`. Use `tests`
only to name *new* tests this task must add.

## Sizing

One card = one fresh-context run to completion. If a card can't plausibly be finished and verified in a
single run, split it and wire the pieces with `depends_on`. Small, ordered, independently-verifiable
beats one big card.

## Before you finish

1. Filename `<id>.json` matches the `id`; it's in `tasks/backlog/`; prefix is the next free number.
2. `depends_on` points at ids that exist.
3. Validate the card and preview the loop's prompt:
   ```
   node scripts/format-prompt.mjs tasks/backlog/<id>.json
   ```
   It exits non-zero if the card is malformed or the rendered prompt exceeds the `/goal` 4000-char
   limit. The prompt is a compact, fixed procedure — the run reads your `goal`/`acceptance`/`context`/
   `skills`/`tests` straight from the card file, so they are NOT inlined into the prompt and the card's
   length doesn't bloat it. Make those fields clear and self-contained; the agent reads them verbatim.
