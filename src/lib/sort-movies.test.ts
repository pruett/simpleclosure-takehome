import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_SORT_ID,
  sortMovies,
  type SortableMovie,
} from './sort-movies'

// Votes are deliberately independent of alphabetical order so each ordering is
// distinguishable. `Éclair` also exercises locale-aware comparison: a naive
// ASCII sort would order these as [Zoo, apple, Éclair] (uppercase < lowercase <
// accented), whereas localeCompare yields [apple, Éclair, Zoo].
const sample: SortableMovie[] = [
  { title: 'Zoo', vote_average: 6.0 },
  { title: 'apple', vote_average: 9.0 },
  { title: 'Éclair', vote_average: 3.0 },
]

const titlesOf = (movies: SortableMovie[]) => movies.map((m) => m.title)

describe('sortMovies', () => {
  test('sorts by score descending (the default)', () => {
    expect(titlesOf(sortMovies(sample, 'score-desc'))).toEqual([
      'apple',
      'Zoo',
      'Éclair',
    ])
    // The default argument matches DEFAULT_SORT_ID (score descending).
    expect(DEFAULT_SORT_ID).toBe('score-desc')
    expect(titlesOf(sortMovies(sample))).toEqual(['apple', 'Zoo', 'Éclair'])
  })

  test('sorts by score ascending', () => {
    expect(titlesOf(sortMovies(sample, 'score-asc'))).toEqual([
      'Éclair',
      'Zoo',
      'apple',
    ])
  })

  test('sorts alphabetically by title (locale-aware)', () => {
    expect(titlesOf(sortMovies(sample, 'title-asc'))).toEqual([
      'apple',
      'Éclair',
      'Zoo',
    ])
  })

  test('sorts reverse-alphabetically by title (locale-aware)', () => {
    expect(titlesOf(sortMovies(sample, 'title-desc'))).toEqual([
      'Zoo',
      'Éclair',
      'apple',
    ])
  })

  test('does not mutate the input array', () => {
    const before = titlesOf(sample)
    sortMovies(sample, 'score-asc')
    sortMovies(sample, 'title-asc')
    expect(titlesOf(sample)).toEqual(before)
  })
})
