"use client";

import { useMemo, useState, type ReactNode } from "react";

import { MovieCard } from "@/components/movie-card";
import type { Movie } from "@/data/tmdb";
import { DEFAULT_SORT_ID, type SortId, sortMovies } from "@/lib/sort-movies";
import { cn } from "@/lib/utils";

/**
 * Grid layout shared with {@link MovieGridSkeleton} so the Suspense fallback
 * occupies the same footprint as the resolved grid (no layout shift).
 */
export const MOVIE_GRID_CLASSNAME =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** A single segment of the sort control; amber-filled when it is the active sort. */
function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-amber-400 text-neutral-950 shadow-sm shadow-amber-400/20"
          : "text-neutral-300 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Client boundary for the homepage grid. Receives the already-fetched movies as
 * props from the server component and owns the sort state (plain `useState` —
 * no URL sync, no refetch, no navigation). Re-sorting happens on the client via
 * the shared, client-safe {@link sortMovies} helper, so the prerendered static
 * shell is unaffected. Default order is score descending — the DAL's order.
 */
export function SortableMovieGrid({ movies }: { movies: Movie[] }) {
  const [sort, setSort] = useState<SortId>(DEFAULT_SORT_ID);
  const sorted = useMemo(() => sortMovies(movies, sort), [movies, sort]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Sort
        </span>

        <div className="flex items-center gap-1 rounded-full bg-neutral-900/60 p-1 ring-1 ring-white/10">
          <span className="px-2 text-xs font-medium text-neutral-500">
            Score
          </span>
          <div
            role="group"
            aria-label="Sort by score"
            className="flex items-center gap-1"
          >
            <SortButton
              active={sort === "score-desc"}
              onClick={() => setSort("score-desc")}
            >
              High → Low
            </SortButton>
            <SortButton
              active={sort === "score-asc"}
              onClick={() => setSort("score-asc")}
            >
              Low → High
            </SortButton>
          </div>

          <span aria-hidden className="mx-1 h-4 w-px bg-white/10" />

          <span className="px-2 text-xs font-medium text-neutral-500">
            Title
          </span>
          <div
            role="group"
            aria-label="Sort alphabetically by title"
            className="flex items-center gap-1"
          >
            <SortButton
              active={sort === "title-asc"}
              onClick={() => setSort("title-asc")}
            >
              A → Z
            </SortButton>
          </div>
        </div>
      </div>

      <section aria-label="Movies" className={MOVIE_GRID_CLASSNAME}>
        {sorted.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </section>
    </div>
  );
}
