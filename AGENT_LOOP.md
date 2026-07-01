/goal Build ONE task — card {{ID}} ({{TITLE}}) at {{TASK_PATH}} — to a verifiable end state. DONE = the card is in tasks/done/ with EVERY acceptance check passing (each run as a real command with output pasted) and every listed test written and green, then committed. If a check cannot pass this run, move the card to tasks/blocked/ (print the failing check + reason) and do NOT commit. Never touch another card.

The card @{{TASK_PATH}} is a JSON file with `goal`, `acceptance[]`, and optional `context`, `skills[]`, `tests[]`. Its lane (directory) is its status; move it with `git mv`. A card has no notes/status field — cross-run memory goes in JOURNAL.md.

Loop:
1. Read the card. If it lists `skills`, invoke each (Skill tool) BEFORE implementing.
2. Skim the repo; read JOURNAL.md (shared cross-run memory) and honor it.
3. Claim it: `git mv {{TASK_PATH}}` into tasks/in_progress/.
4. Implement to satisfy the `goal` and EVERY `acceptance` item; write every `tests` entry. Scope changes to this task only.
5. Verify for real: run each acceptance check and each test as an actual command (browser checks via the mcp__claude-in-chrome__ tools) and paste the output. ALWAYS also run `bun run test` when package.json defines a `test` script — it must pass.
6. If everything passes: append to JOURNAL.md ONLY if a future run needs it (durable decision, gotcha, or convention — high signal only), then `git mv` the card into tasks/done/ and `git add -A && git commit -m "task {{ID}}: {{TITLE}}"`.
7. If something cannot pass this run: print the failing check + reason, `git mv` the card into tasks/blocked/, and do NOT commit.
8. Print the final card so the outcome is judgeable from the transcript.

Rules: only this task — never move another card. Never move a card to done/ without pasted, passing output for every check and test. If acceptance is ambiguous, block and say why — do not guess.
