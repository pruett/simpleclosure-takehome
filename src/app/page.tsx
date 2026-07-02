import { Suspense } from "react";

import { MovieGrid, MovieGridSkeleton } from "@/components/movie-grid";

// Server component (no client directive): the TMDB API key stays on the
// server, reached only through the server-only `use cache` data layer in
// @/data/tmdb. Under Cache Components the static header and the Suspense
// fallback form the prerendered shell; MovieGrid's cached content is resolved
// into that shell at build time and streams in behind the skeleton whenever
// the cache entry has to be regenerated.
export default function Home() {
  return (
    <main className="min-h-svh bg-neutral-950 px-6 py-12 font-sans text-neutral-100 sm:px-10 lg:px-16">
      <header className="mx-auto mb-10 max-w-7xl border-b border-white/10 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-400">
          Now Discovering
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Science Fiction
        </h1>
        <p className="mt-2 max-w-prose text-sm text-neutral-400">
          Top-rated science-fiction titles from The Movie Database, ranked by
          audience score.
        </p>
      </header>

      <Suspense fallback={<MovieGridSkeleton />}>
        <MovieGrid />
      </Suspense>
    </main>
  );
}
