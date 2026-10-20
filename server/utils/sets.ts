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

const artistNames = (artist: string) => artist.split(' & ')

/** Other sets sharing at least one artist (b2b sets list each artist), most viewed first */
export function setsByArtists(artist: string, excludeId: string, limit: number): DjSet[] {
  const names = new Set(artistNames(artist))
  return sets
    .filter(s => s.id !== excludeId && artistNames(s.artist).some(n => names.has(n)))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
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

let cityPoints: CityPoint[] | undefined

export function getCityPoints(): CityPoint[] {
  if (cityPoints) return cityPoints
  const byCity = new Map<string, DjSet[]>()
  for (const s of sets) {
    if (s.city && s.coords) byCity.set(s.city, [...(byCity.get(s.city) ?? []), s])
  }
  const round = (n: number) => Math.round(n * 1000) / 1000
  const average = (list: DjSet[], i: 0 | 1) => round(list.reduce((sum, s) => sum + s.coords![i], 0) / list.length)
  cityPoints = [...byCity]
    .map(([city, list]) => ({ city, country: list[0]!.country, coords: [average(list, 0), average(list, 1)] as [number, number], count: list.length }))
    .sort((a, b) => b.count - a.count)
  return cityPoints
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
