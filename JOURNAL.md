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

## 003-tmdb-data-layer — Server-only TMDB data layer for /discover/movie
- **Module: `src/data/tmdb.ts`** (server-only; first line is `import 'server-only'`). Follows the Next.js data-security guide's Data Access Layer pattern: DAL modules live under `src/data/` (NOT `src/lib/` — that's for UI helpers like shadcn's `utils.ts`), and return **minimal DTOs** — raw TMDB records are stripped to the `Movie` fields before leaving the module. A dependent UI task should import from here, never call TMDB directly.
- **Exports**: `discoverMovies(options?: { genreId?: number; sortBy?: 'vote_average'; sortDirection?: 'asc'|'desc' }): Promise<Movie[]>` — fetches page 1 of `/discover/movie`. Also `sortMovies(...)`, `DEFAULT_GENRE_ID` (878), and the `Movie` DTO type (`id, title, poster_path, vote_average, genre_ids`).
- **Default filter**: `with_genres=878` (Science Fiction). **Sort**: applied in OUR code via `Array.prototype.toSorted` on `vote_average`, `desc` by default (not relying on TMDB `sort_by`).
- **API key**: read only via `process.env.TMDB_API_KEY`. Lives in `.env.local` (gitignored); `.env.example` is force-committed (documents the takehome key). Never hardcode it in `src/`.
- **Testing gotcha**: `bun test` sets `NODE_ENV=test`, so (a) it does NOT auto-load `.env.local`, and (b) the `server-only` package throws on import (no `react-server` condition), and (c) `cacheLife`/`cacheTag` from `next/cache` throw outside the Next.js server runtime (`use cache` is uncompiled under Bun). All handled by the preload `src/test/setup-tests.ts`, wired via `bunfig.toml` `[test].preload`, which stubs `server-only` and `next/cache` and loads `.env.local`. Also needed `@types/bun` (dev) so `next build`'s typecheck resolves `bun:test`.
- `package.json` `"test": "bun test"`. Tests hit the REAL TMDB API (network required).

## 004-movie-grid — Render TMDB movies in a responsive grid of shadcn Cards
- **Cache Components architecture** (`cacheComponents: true` in `next.config.ts`): caching is data-level via the `use cache` directive in `discoverMovies` (`cacheLife('hours')` + `cacheTag(MOVIES_CACHE_TAG)`, tag = `'tmdb-movies'`, exported from `@/data/tmdb`) — the old fetch-level `next: { revalidate: 3600 }` was removed per the migrating-to-cache-components guide. `/` prerenders as a static shell (build output shows Revalidate 1h / Expire 1d); **build needs network + `TMDB_API_KEY`** since the cached fetch runs at prerender. Tasks 005/006: expire movie data from a Server Action with `updateTag(MOVIES_CACHE_TAG)` / `revalidateTag`.
- **Homepage `src/app/page.tsx`** is a sync server component: static header + `<Suspense fallback={<MovieGridSkeleton/>}>` around the async **`MovieGrid`** (`src/components/movie-grid.tsx`), which awaits `discoverMovies()` and maps to `<MovieCard>`. Grid + skeleton share the responsive classes `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` so the fallback doesn't shift layout.
- **Card component: `src/components/movie-card.tsx`** (`MovieCard`). Poster via `next/image` `fill` in an `aspect-[2/3]` wrapper; **extra property shown = `vote_average`** as an overlaid ★ badge (top-right). Null `poster_path` → styled "No poster" placeholder branch (page 1 currently has 0 nulls).
- **`next.config.ts`**: `images.remotePatterns` allows `image.tmdb.org` `/t/p/**` (the poster CDN — distinct from the `api.themoviedb.org` data host). Posters serve through `/_next/image`.
- **Deferred to 005/006**: hover effects, CSS transitions, filter/sort UI — intentionally NOT added here.
