import {
  MOVIE_GRID_CLASSNAME,
  SortableMovieGrid,
} from "@/components/sortable-movie-grid";
import { discoverMovies } from "@/data/tmdb";

/** TMDB `/discover/movie` returns 20 results per page. */
const MOVIES_PER_PAGE = 20;

/**
 * Async server component that fetches the movies from the `use cache` data
 * layer, so at build time the resolved list is part of the route's static
 * shell. Rendering (and client-side re-sorting) is delegated to the
 * {@link SortableMovieGrid} client component, which receives the movies as
 * props — data fetching stays server-only; only sort state is client state.
 */
export async function MovieGrid() {
  const movies = await discoverMovies();

  return <SortableMovieGrid movies={movies} />;
}

/**
 * Suspense fallback for {@link MovieGrid}: a placeholder for the sort controls
 * (so the controls' height is reserved and nothing shifts when content resolves)
 * plus one pulsing card placeholder per expected movie, mirroring the grid.
 */
export function MovieGridSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-9 w-72 max-w-full animate-pulse rounded-full bg-neutral-900/60 ring-1 ring-white/10" />
      </div>

      <section className={MOVIE_GRID_CLASSNAME}>
        {Array.from({ length: MOVIES_PER_PAGE }, (_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl bg-neutral-900/60 ring-1 ring-white/10"
          >
            <div className="aspect-[2/3] w-full bg-neutral-800" />
            <div className="px-3 py-3">
              <div className="h-4 w-3/4 rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
