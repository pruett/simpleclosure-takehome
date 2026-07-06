"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

import { MovieCard } from "@/components/movie-card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { Movie } from "@/data/tmdb";
import {
  DEFAULT_DIRECTION,
  DEFAULT_SORT_ID,
  type SortCategory,
  type SortId,
  sortMovies,
} from "@/lib/sort-movies";
import { cn } from "@/lib/utils";

/**
 * Grid layout shared with {@link MovieGridSkeleton} so the Suspense fallback
 * occupies the same footprint as the resolved grid (no layout shift).
 */
export const MOVIE_GRID_CLASSNAME =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

const CATEGORY_LABELS: Record<SortCategory, string> = {
  score: "Score",
  title: "Title",
};

/**
 * One button per sort category. Clicking an inactive category activates it in
 * its default direction; clicking the active one flips the direction. Every
 * button always shows a direction arrow (current direction when active, the
 * category's default when inactive) so the button width never changes.
 */
function SortCategoryButton({
  category,
  sort,
  onSelect,
}: {
  category: SortCategory;
  sort: SortId;
  onSelect: (sort: SortId) => void;
}) {
  const [activeCategory, direction] = sort.split("-") as [
    SortCategory,
    "asc" | "desc",
  ];
  const active = activeCategory === category;
  const next: SortId = active
    ? `${category}-${direction === "asc" ? "desc" : "asc"}`
    : `${category}-${DEFAULT_DIRECTION[category]}`;

  const shownDirection = active ? direction : DEFAULT_DIRECTION[category];
  const Arrow = shownDirection === "asc" ? ArrowUp : ArrowDown;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={active}
      aria-label={
        active
          ? `Sorted by ${category}, ${direction === "asc" ? "ascending" : "descending"}. Reverse order`
          : `Sort by ${category}`
      }
      onClick={() => onSelect(next)}
      className={cn(
        // The page is a fixed dark design without the `.dark` token class, so
        // the outline variant's light-theme tokens are overridden here.
        "border-white/10 bg-neutral-900/60 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white",
        active &&
          "border-amber-400 bg-amber-400 text-neutral-950 shadow-sm shadow-amber-400/20 hover:bg-amber-300 hover:text-neutral-950",
      )}
    >
      {CATEGORY_LABELS[category]}
      <Arrow aria-hidden className={cn(!active && "opacity-40")} />
    </Button>
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

        <ButtonGroup aria-label="Sort movies">
          <SortCategoryButton category="score" sort={sort} onSelect={setSort} />
          <SortCategoryButton category="title" sort={sort} onSelect={setSort} />
        </ButtonGroup>
      </div>

      <section aria-label="Movies" className={MOVIE_GRID_CLASSNAME}>
        {sorted.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </section>
    </div>
  );
}
