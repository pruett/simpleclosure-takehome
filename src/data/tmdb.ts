import 'server-only'

/**
 * Data Access Layer (DAL) for TMDB `/discover/movie`, per the Next.js
 * data-security guide (`data/` directory, server-only, minimal DTOs).
 *
 * Only this module reads `process.env` for the TMDB credential, and the
 * `server-only` import above guarantees a build error if it is ever imported
 * into a client bundle. Raw TMDB records never leave this module — responses
 * are mapped to the minimal {@link Movie} DTO before being returned.
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

/** Science Fiction. Default genre applied as the `with_genres` filter. */
export const DEFAULT_GENRE_ID = 878

/**
 * Minimal DTO exposed to the render context — only the fields the UI needs.
 * Deliberately NOT the raw TMDB record, which carries many more fields.
 */
export interface Movie {
  id: number
  title: string
  poster_path: string | null
  vote_average: number
  genre_ids: number[]
}

/** Shape of a raw `/discover/movie` result. A superset of {@link Movie}. */
interface TmdbDiscoverResult extends Movie {
  [extra: string]: unknown
}

/** Strip a raw TMDB record down to the minimal DTO. */
function toMovie(raw: TmdbDiscoverResult): Movie {
  return {
    id: raw.id,
    title: raw.title,
    poster_path: raw.poster_path,
    vote_average: raw.vote_average,
    genre_ids: raw.genre_ids,
  }
}

/** The property we sort on in our own code (not solely via TMDB's `sort_by`). */
export type SortProperty = 'vote_average'
export type SortDirection = 'asc' | 'desc'

export interface DiscoverMoviesOptions {
  /** Genre id applied as `with_genres`. Defaults to {@link DEFAULT_GENRE_ID}. */
  genreId?: number
  /** Property to sort the fetched page by in our code. Defaults to `vote_average`. */
  sortBy?: SortProperty
  /** Sort direction. Defaults to `desc` (highest rated first). */
  sortDirection?: SortDirection
}

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY
  if (!key) {
    throw new Error(
      'TMDB_API_KEY is not set. Add it to .env.local (see .env.example).',
    )
  }
  return key
}

/**
 * Fetch page 1 of TMDB `/discover/movie` with a genre filter applied, then
 * sort the returned page in our own code by the chosen property/direction.
 *
 * @returns The movies for page 1, sorted client-side (in our code).
 */
export async function discoverMovies(
  options: DiscoverMoviesOptions = {},
): Promise<Movie[]> {
  const {
    genreId = DEFAULT_GENRE_ID,
    sortBy = 'vote_average',
    sortDirection = 'desc',
  } = options

  const url = new URL(`${TMDB_BASE_URL}/discover/movie`)
  url.searchParams.set('api_key', getApiKey())
  url.searchParams.set('page', '1')
  url.searchParams.set('with_genres', String(genreId))

  const res = await fetch(url, {
    // Cache the response; TMDB catalog data changes infrequently.
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as { results: TmdbDiscoverResult[] }
  return sortMovies(data.results.map(toMovie), sortBy, sortDirection)
}

/** Sort movies in our own code (uses `Array.prototype.toSorted`). */
export function sortMovies(
  movies: Movie[],
  sortBy: SortProperty = 'vote_average',
  sortDirection: SortDirection = 'desc',
): Movie[] {
  return movies.toSorted((a, b) =>
    sortDirection === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy],
  )
}
