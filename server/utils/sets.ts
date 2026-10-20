import type { H3Event } from 'h3'
import raw from '../../data/sets.json'

const sets = raw as DjSet[]
const setsById = new Map(sets.map(s => [s.id, s]))

export interface SetQuery {
  genres: string[]
  cities: string[]
  broadcasters: string[]
  settings: string[]
  exclude: Set<string>
}

function toList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map(v => v.trim())
}

export function parseSetQuery(event: H3Event): SetQuery {
  const q = getQuery(event)
  return {
    genres: toList(q.genre),
    cities: toList(q.city),
    broadcasters: toList(q.broadcaster),
    settings: toList(q.setting),
    exclude: new Set(toList(q.exclude)),
  }
}

const matchesAny = (selected: string[], value: string | null) => selected.length === 0 || (value !== null && selected.includes(value))

export function filterSets(q: SetQuery): DjSet[] {
  return sets.filter(s =>
    matchesAny(q.cities, s.city)
    && matchesAny(q.broadcasters, s.broadcaster)
    && matchesAny(q.settings, s.setting)
    && (q.genres.length === 0 || q.genres.some(g => s.genres.includes(g))),
  )
}

export function findSet(id: string): DjSet | undefined {
  return setsById.get(id)
}

function countBy(values: (string | null)[]): FacetCount[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

let facets: Facets | undefined

/** The data is static per deploy, so facets are computed once. */
export function getFacets(): Facets {
  facets ??= {
    total: sets.length,
    genres: countBy(sets.flatMap(s => s.genres)),
    cities: countBy(sets.map(s => s.city)),
    broadcasters: countBy(sets.map(s => s.broadcaster)),
    settings: countBy(sets.map(s => s.setting)),
  }
  return facets
}
