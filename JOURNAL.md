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

## 005-movie-card-tilt-hover — CSS-only 3D tilt on hover
- **Pure CSS, no JS**: `MovieCard` (`src/components/movie-card.tsx`) stays a server component. The `<Card>` is wrapped in a `[perspective:1000px]` div (perspective must live on the *parent* of the tilted element); the Card itself gets `[transform-style:preserve-3d]` + a **fixed** hover tilt `rotateX(5deg) rotateY(-6deg) translateZ(14px) scale(1.03)` with `hover:shadow-2xl hover:shadow-black/60` for depth. No mouse-position tracking / handlers — deliberately simple.
- **Reduced-motion**: the transition + hover transform + hover shadow are all gated behind Tailwind's **`motion-safe:`** variant, so `prefers-reduced-motion: reduce` users get transform `none` on hover. Convention for future hover/animation work: prefer `motion-safe:` over `motion-reduce:` so the default (reduce) state is motionless. Verified in-browser: resting `none` → hover `matrix3d(...)` → mouse-out `none`, zero console errors.

## 006-client-side-sorting — Client-side sort controls above the grid
- **Sort logic lives in `src/lib/sort-movies.ts`** (client-safe, imports NOTHING from `@/data` and no `server-only`). It's **generic** over `{ title, vote_average }` (`SortableMovie`), so it never imports the `Movie` DTO — that's how both the server DAL and a client component can share it without the client pulling server code. Exports `sortMovies(movies, sortId?)`, `SortId` (template type `` `${SortCategory}-${SortDirection}` `` = score/title × asc/desc), `SortCategory`, `SortDirection`, `DEFAULT_SORT_ID` (`'score-desc'`), `DEFAULT_DIRECTION` (score→desc, title→asc). Alphabetical = `localeCompare` (locale-aware). Unit tests: `src/lib/sort-movies.test.ts`. The DAL's own `sortMovies`/`SortProperty`/`SortDirection` exports were REMOVED and its pure-sort tests moved to the lib test. (`SORT_OPTIONS` was later removed as unused.)
- **Client boundary = `src/components/sortable-movie-grid.tsx`** (`'use client'`, the ONLY file with the directive). `MovieGrid` (server) now just fetches and renders `<SortableMovieGrid movies={...} />`; the client component owns sort state (`useState<SortId>`) + the controls UI + the grid `<section>`. `MovieCard` is rendered inside it and stays directive-free (client-bundled, no server-only deps) — page/grid/card kept as server components per task 005.
- **Sort state is client-only** — plain `useState`, **no `searchParams`, no URL sync, no refetch, no navigation** (route stays a static prerendered shell; build still shows `/` as `○ Static`). Verified in-browser: toggling all sorts kept navigationCount=1, resourceCount=31, 0 `api.themoviedb.org` requests, 0 console errors.
- The shared grid layout className (`MOVIE_GRID_CLASSNAME`) is exported from the client file and imported by `MovieGridSkeleton`; the skeleton also reserves a controls-row placeholder (`h-7`, matching the `size="sm"` buttons) so nothing shifts. Don't import from `movie-grid.tsx` into a client module — it exports an async server component.
- **Controls UI (refined post-commit): one button per category** (Score, Title) via `SortCategoryButton` in `sortable-movie-grid.tsx`. Click an inactive category → activates it in its `DEFAULT_DIRECTION`; click the active one → reverses direction. **Every button always renders its lucide `ArrowUp`/`ArrowDown`** (current direction when active, `DEFAULT_DIRECTION` when inactive at 40% opacity) so button widths never change — no layout jump on toggle (verified: widths pixel-identical across all states). Arrows are aria-hidden; direction is also in the `aria-label`. Verified in-browser: all 4 orderings reorder the grid, 0 TMDB requests, 0 console errors; build still `○ Static` (Revalidate 1h / Expire 1d).
- **Controls migrated to shadcn/ui `ButtonGroup` + `Button`** (registry components pulled via `npx shadcn add button-group button skeleton` → `src/components/ui/{button,button-group,separator,skeleton}.tsx`, `base-nova` style, Base UI primitives). `ButtonGroup` provides `role="group"`, joined corners, and shared inner borders itself. GOTCHA: the page is a hard-coded dark design (`bg-neutral-950`) but the theme tokens in `globals.css` default to light and nothing applies `.dark`, so shadcn's semantic tokens resolve to LIGHT values here — dark/amber colors are overridden at the call site via `className` (the shadcn consumer pattern; comment in `SortCategoryButton` explains). Same applies to `MovieGridSkeleton`: it uses `<Skeleton>` with the original `bg-neutral-900/60` classes overriding `bg-muted`.
- **"Cache disabled" badge in the dev overlay is NOT a code regression**: Next dev shows it when the request arrives with `cache-control: no-cache` — i.e. a hard refresh or browser DevTools open with "Disable cache" checked (`isBypassingCachesInDev` in `next/dist/server/app-render/app-render.js`). Dev-only, per-request cache bypass; production prerender/`use cache` are unaffected. Normal reload with DevTools' "Disable cache" off makes it go away.
