# Journal — shared memory across runs

Every run reads this file at the **start** (together with `AGENT_LOOP.md`), and before
finishing appends here **only if** it produced something a future fresh-context run genuinely
needs to know. This is not a per-run diary — **high signal only.**

**Write an entry when the run:**
- made a decision future tasks depend on (app root / layout, package manager, pinned versions, chosen library or config),
- hit a non-obvious gotcha or workaround (a required flag, a tool that refuses X, an env quirk),
- established a convention other tasks should follow.

**Do NOT write:**
- restatements of the task, or routine "installed X / build passed" progress,
- anything already obvious from the code, the task files, or git history.

Keep each entry to a few tight lines. Prune or correct an entry if a later run supersedes it.
Format: one `## <task-id> — <title>` section with `-` bullets beneath it.

---
<!-- entries below, newest at the bottom -->
