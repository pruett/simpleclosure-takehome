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

## 001-scaffold-nextjs — Scaffold Next.js app with Bun (root, src/ pattern)
- **Package manager / CLI: Bun** is the preferred tool for this repo. Use `bun install`, `bun run <script>`, and `bunx --bun ...` — do NOT use npm/yarn/pnpm (no `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`; the lockfile is `bun.lock`).
- **App root: `.` (repo ROOT)** — the Next.js app lives directly at the repo root, not in `web/`. All app paths resolve from root: `package.json`, `src/app/page.tsx`, `bun.lock`, `next.config.ts`, etc. Dependent tasks should assume root, not `web/`.
- Next.js version is **16.2.10** (App Router, Turbopack, Tailwind v4, `src/` dir, import alias `@/*`). This is a newer major with breaking changes vs. Next 15 — the scaffold's `AGENTS.md`/`CLAUDE.md` note it; consult `node_modules/next/dist/docs/` when unsure.
- Default landing page wording in Next 16 is "To get started, edit the page.tsx file." + "Deploy Now" (not Next 15's "Get started by editing src/app/page.tsx").
- Dev server: `bunx --bun next dev -p 3000`.

## 002-shadcn-card — Add shadcn/ui (Tailwind v4) and render a Card
- **shadcn CLI changed (v3.x)**: `init` is non-interactive only if you pass a preset. Flags shifted: `-b/--base` now selects the component library (`radix`|`base`), NOT the base color; the base color/theme comes from `-p/--preset` (`nova`,`vega`,`maia`,...). Non-interactive init used here: `bunx --bun shadcn@latest init -b base -p nova --yes`. Add components: `bunx --bun shadcn@latest add <name> --yes`.
- shadcn detected existing Next.js + Tailwind v4 and only added deps + `src/lib/utils.ts` + updated `src/app/globals.css` (base color CSS vars). Card lives at `src/components/ui/card.tsx`; exports Card/CardHeader/CardTitle/CardDescription/CardAction/CardContent/CardFooter.
- **agent-browser CLI is not on PATH**; run it via `npx -y agent-browser@latest ...` for browser verification/screenshots. (mcp claude-in-chrome tools were not available this session.)
