/**
 * Client-safe movie sorting, shared by the server-only DAL (`@/data/tmdb`) and
 * the client sort controls (`@/components/sortable-movie-grid`).
 *
 * This module deliberately imports nothing from `@/data` and does NOT import
 * `server-only`, so it runs in either environment. It is generic over the two
 * fields it compares, so it never needs to reference the `Movie` DTO — any
 * object with `title` and `vote_average` (the DTO included) satisfies it.
 */

/** The minimal shape {@link sortMovies} compares on. `Movie` satisfies it. */
export interface SortableMovie {
  title: string
  vote_average: number
}

/** Identifier for each user-selectable ordering. */
export type SortId = 'score-desc' | 'score-asc' | 'title-asc'

/** Default ordering — highest audience score first (the DAL's shell order). */
export const DEFAULT_SORT_ID: SortId = 'score-desc'

/** Ordered sort options, for building the control UI. */
export const SORT_OPTIONS: ReadonlyArray<{ id: SortId; label: string }> = [
  { id: 'score-desc', label: 'Score: high to low' },
  { id: 'score-asc', label: 'Score: low to high' },
  { id: 'title-asc', label: 'Title: A to Z' },
]

/**
 * Return a new array sorted by the chosen ordering. Never mutates the input
 * (uses `Array.prototype.toSorted`). Alphabetical sorting is locale-aware via
 * `String.prototype.localeCompare`, so accents and case sort naturally.
 */
export function sortMovies<T extends SortableMovie>(
  movies: T[],
  sort: SortId = DEFAULT_SORT_ID,
): T[] {
  switch (sort) {
    case 'score-asc':
      return movies.toSorted((a, b) => a.vote_average - b.vote_average)
    case 'title-asc':
      return movies.toSorted((a, b) => a.title.localeCompare(b.title))
    case 'score-desc':
    default:
      return movies.toSorted((a, b) => b.vote_average - a.vote_average)
  }
}
