---
description: Dry-run ONE task from the backlog in the current session (no fresh context)
---
Run `node scripts/next-task.mjs` to get the next task card's path. If it prints `DONE`, `BLOCKED`, or `STUCK`, report that and stop.

Otherwise run `node scripts/format-prompt.mjs <that path>` to validate the card and render the exact `/goal` prompt the real loop would send, then follow that prompt for the one card — reviewing `JOURNAL.md` first. That means: load any listed skills, claim it (`git mv` to `tasks/in_progress/`), implement it, run each acceptance check and each required test and paste the real command output, then move it to its final lane (`tasks/done/` + commit, or `tasks/blocked/` + print the failing check and reason). Print the card's contents and stop.

This runs in the CURRENT session (context is NOT reset) — it's for testing the loop on one task. For the real run with a fresh context window per task, use `./run-backlog.sh`.
