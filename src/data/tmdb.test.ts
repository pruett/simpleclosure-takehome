import { describe, expect, test } from 'bun:test'
import { DEFAULT_GENRE_ID, discoverMovies } from './tmdb'

// The pure sort helper now lives in the shared client-safe module and is
// covered by src/lib/sort-movies.test.ts. These tests exercise the DAL, whose
// default order (score descending) is asserted below.

// These tests hit the real TMDB API (network required), per the task spec.
describe('discoverMovies (real TMDB /discover/movie)', () => {
  test('returns a non-empty list of movies with the expected shape', async () => {
    const movies = await discoverMovies()

    expect(Array.isArray(movies)).toBe(true)
    expect(movies.length).toBeGreaterThan(0)

    for (const movie of movies) {
      expect(typeof movie.id).toBe('number')
      expect(typeof movie.title).toBe('string')
      // poster_path is a string or null in TMDB's schema.
      expect(['string', 'object']).toContain(typeof movie.poster_path)
      // vote_average is our chosen sort property.
      expect(typeof movie.vote_average).toBe('number')
      // DAL returns a minimal DTO — raw TMDB fields must not leak through.
      expect(Object.keys(movie).sort()).toEqual([
        'genre_ids',
        'id',
        'poster_path',
        'title',
        'vote_average',
      ])
    }
  })

  test('genre filter: every movie has the default genre id in genre_ids', async () => {
    const movies = await discoverMovies({ genreId: DEFAULT_GENRE_ID })

    expect(movies.length).toBeGreaterThan(0)
    for (const movie of movies) {
      expect(movie.genre_ids).toContain(DEFAULT_GENRE_ID)
    }
  })

  test('sort: results are ordered by vote_average descending', async () => {
    const movies = await discoverMovies()

    expect(movies.length).toBeGreaterThan(0)
    for (let i = 1; i < movies.length; i++) {
      expect(movies[i - 1].vote_average).toBeGreaterThanOrEqual(
        movies[i].vote_average,
      )
    }
  })
})
