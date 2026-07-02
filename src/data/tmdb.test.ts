import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_GENRE_ID,
  discoverMovies,
  sortMovies,
  type Movie,
} from './tmdb'

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

describe('sortMovies (pure, in our code)', () => {
  const sample: Movie[] = [
    { id: 1, title: 'A', poster_path: null, vote_average: 5.5, genre_ids: [878] },
    { id: 2, title: 'B', poster_path: null, vote_average: 8.1, genre_ids: [878] },
    { id: 3, title: 'C', poster_path: null, vote_average: 7.0, genre_ids: [878] },
  ]

  test('sorts by vote_average descending by default', () => {
    expect(sortMovies(sample).map((m) => m.id)).toEqual([2, 3, 1])
  })

  test('sorts ascending when requested and does not mutate input', () => {
    const asc = sortMovies(sample, 'vote_average', 'asc')
    expect(asc.map((m) => m.id)).toEqual([1, 3, 2])
    // original order preserved (toSorted returns a copy)
    expect(sample.map((m) => m.id)).toEqual([1, 2, 3])
  })
})
