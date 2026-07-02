import { MovieCard } from "@/components/movie-card";
import { discoverMovies } from "@/data/tmdb";

/** TMDB `/discover/movie` returns 20 results per page. */
const MOVIES_PER_PAGE = 20;

// Shared by the grid and its skeleton so the Suspense fallback occupies the
// exact same layout as the streamed-in content (no shift when it resolves).
const gridClassName =
  "mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/**
 * Async server component that renders the movie grid. The data comes from the
 * `use cache` data layer, so at build time the resolved grid is part of the
 * route's static shell; on a cache miss at request time the shell streams the
 * {@link MovieGridSkeleton} fallback first via the page's Suspense boundary.
 */
export async function MovieGrid() {
  const movies = await discoverMovies();

  return (
    <section aria-label="Movies" className={gridClassName}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </section>
  );
}

/**
 * Suspense fallback for {@link MovieGrid}: one pulsing placeholder per
 * expected card, mirroring MovieCard's poster aspect ratio and title row.
 */
export function MovieGridSkeleton() {
  return (
    <section aria-hidden className={gridClassName}>
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
  );
}
