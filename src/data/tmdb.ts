import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { sortMovies } from '@/lib/sort-movies'

/**
 * Data Access Layer (DAL) for TMDB `/discover/movie`, per the Next.js
 * data-security guide (`data/` directory, server-only, minimal DTOs).
 *
 * Only this module reads `process.env` for the TMDB credential, and the
 * `server-only` import above guarantees a build error if it is ever imported
 * into a client bundle. Raw TMDB records never leave this module — responses
 * are mapped to the minimal {@link Movie} DTO before being returned.
 *
 * Caching follows the Cache Components model (`cacheComponents: true`):
 * {@link discoverMovies} is a `use cache` function, so its result — keyed by
 * the options argument — is cached at the data level and included in the
 * route's prerendered static shell.
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

/** Cache tag for all TMDB movie data; expire via `revalidateTag`/`updateTag`. */
export const MOVIES_CACHE_TAG = 'tmdb-movies'

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

export interface DiscoverMoviesOptions {
  /** Genre id applied as `with_genres`. Defaults to {@link DEFAULT_GENRE_ID}. */
  genreId?: number
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
 * Fetch page 1 of TMDB `/discover/movie` with a genre filter applied, and
 * return it in a sensible default order (highest audience score first).
 *
 * Sorting is now a client concern: the shared, client-safe {@link sortMovies}
 * helper (`@/lib/sort-movies`) applies the default here so the prerendered
 * shell is ordered, and the client re-sorts the same data without refetching.
 *
 * Data-level `use cache`: the options argument is the cache key, so each genre
 * caches independently. TMDB catalog data changes infrequently, so the `hours`
 * profile replaces the previous fetch-level `next: { revalidate: 3600 }`.
 *
 * @returns The movies for page 1, ordered by the default (score descending).
 */
export async function discoverMovies(
  options: DiscoverMoviesOptions = {},
): Promise<Movie[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(MOVIES_CACHE_TAG)

  const { genreId = DEFAULT_GENRE_ID } = options

  const url = new URL(`${TMDB_BASE_URL}/discover/movie`)
  url.searchParams.set('api_key', getApiKey())
  url.searchParams.set('page', '1')
  url.searchParams.set('with_genres', String(genreId))

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as { results: TmdbDiscoverResult[] }
  return sortMovies(data.results.map(toMovie))
}
