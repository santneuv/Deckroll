import { readFileSync, writeFileSync } from 'node:fs'
import type { DjSet } from '../shared/types/dj-set.ts'
import { parseTracklistCues } from './lib/cues.ts'

interface Artist {
  name: string
  genres: string[]
  /** Search text; defaults to "<name> set" */
  query?: string
}

interface Sources {
  minDurationMin: number
  minViews: number
  searchPagesPerArtist: number
  blockedChannels: string[]
  excludedVideos: string[]
  channels: { id: string, name: string }[]
  artists: Artist[]
}

interface Candidate {
  artists: Artist[]
  /** From a curated channel or already in the catalogue: skip the title heuristics */
  trusted: boolean
}

interface PlaylistItemsPage {
  nextPageToken?: string
  items: { snippet: { title: string, resourceId: { videoId: string } } }[]
}

interface SearchPage {
  nextPageToken?: string
  items: { id: { videoId: string }, snippet: { title: string } }[]
}

interface VideosPage {
  items: {
    id: string
    snippet: { title: string, description: string, channelTitle: string, publishedAt: string, liveBroadcastContent: string }
    contentDetails: { duration: string }
    status: { embeddable: boolean }
    statistics: { viewCount?: string }
  }[]
}

type PlaceFields = Pick<DjSet, 'city' | 'country' | 'venue' | 'coords' | 'setting' | 'enrichedAt'>

const EMPTY_PLACE: PlaceFields = { city: null, country: null, venue: null, coords: null, setting: 'other', enrichedAt: null }

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const SOURCES_PATH = new URL('../data/sources.json', import.meta.url)
const SETS_PATH = new URL('../data/sets.json', import.meta.url)
const SEARCH_COST = 100
const COMPILATION = /\b(best of|megamix|non ?-?stop|compilation|tribute|playlist|top \d+|greatest|hits|style|mixed by|album|official (audio|video)|inspired|mix 20\d\d)\b|\bmix\b.*\bby\b/

const apiKey = process.env.YOUTUBE_API_KEY ?? ''
let quotaUsed = 0

async function youtube<T>(endpoint: string, params: Record<string, string>, cost = 1): Promise<T> {
  const url = new URL(`${API_BASE}/${endpoint}`)
  for (const [k, v] of Object.entries({ ...params, key: apiKey })) url.searchParams.set(k, v)
  quotaUsed += cost
  const res = await fetch(url)
  const body = await res.json()
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${body?.error?.message ?? res.statusText}`)
  return body as T
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const wordPattern = (name: string, anchor: '^' | '') =>
  new RegExp(`${anchor || '(^|[^\\p{L}\\p{N}])'}${escapeRegExp(normalize(name))}($|[^\\p{L}\\p{N}])`, 'u')

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function artistMatcher(artists: Artist[]) {
  const patterns = artists.map(artist => ({ artist, pattern: wordPattern(artist.name, '') }))
  return (title: string) => {
    const t = normalize(title)
    return patterns.filter(p => p.pattern.test(t)).map(p => p.artist)
  }
}

function leadsTitle(title: string, artist: Artist): boolean {
  const t = normalize(title).replace(/^[^\p{L}\p{N}]+/u, '').replace(/^dj\s+/, '')
  if (wordPattern(artist.name, '^').test(t)) return true
  const head = t.split(/\s[-|@:–—]\s|:\s/)[0]!
  return /\bb2b\b/.test(head) && wordPattern(artist.name, '').test(head)
}

function isArtistList(normalizedTitle: string): boolean {
  const dashSegments = normalizedTitle.split(/\s[-–—•]\s/).length
  const slashesBetweenNames = normalizedTitle.split(/[|:]/)[0]!.match(/\p{L}\s*\/\s*\p{L}/gu)?.length ?? 0
  return dashSegments >= 4 || slashesBetweenNames >= 2
}

function isArtistSet(title: string, channelTitle: string, candidate: Candidate): boolean {
  if (candidate.trusted) return true
  if (candidate.artists.some(a => normalize(a.name) === normalize(channelTitle))) return true
  const t = normalize(title)
  return !COMPILATION.test(t) && !isArtistList(t) && candidate.artists.some(a => leadsTitle(title, a))
}

function parseIsoDuration(iso: string): number {
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return 0
  const [d, h, min, s] = m.slice(1).map(v => Number(v ?? 0))
  return ((d! * 24 + h!) * 60 + min!) * 60 + s!
}

async function scanChannel(channel: Sources['channels'][number], match: ReturnType<typeof artistMatcher>, found: Map<string, Candidate>) {
  let scanned = 0
  let hits = 0
  let pageToken = ''
  do {
    const page = await youtube<PlaylistItemsPage>('playlistItems', {
      part: 'snippet',
      playlistId: `UU${channel.id.slice(2)}`,
      maxResults: '50',
      ...(pageToken && { pageToken }),
    })
    for (const item of page.items) {
      scanned++
      const artists = match(item.snippet.title)
      if (artists.length > 0) {
        hits++
        found.set(item.snippet.resourceId.videoId, { artists, trusted: true })
      }
    }
    pageToken = page.nextPageToken ?? ''
  } while (pageToken)
  console.log(`channel ${channel.name}: ${scanned} uploads scanned, ${hits} mention an artist`)
}

async function searchArtist(artist: Artist, pages: number, match: ReturnType<typeof artistMatcher>, found: Map<string, Candidate>) {
  let hits = 0
  let pageToken = ''
  for (let i = 0; i < pages; i++) {
    const page = await youtube<SearchPage>('search', {
      part: 'snippet',
      type: 'video',
      videoDuration: 'long',
      q: artist.query ?? `${artist.name} set`,
      maxResults: '50',
      ...(pageToken && { pageToken }),
    }, SEARCH_COST)
    for (const item of page.items) {
      const artists = match(decodeEntities(item.snippet.title))
      if (artists.length > 0 && !found.has(item.id.videoId)) {
        hits++
        found.set(item.id.videoId, { artists, trusted: false })
      }
    }
    pageToken = page.nextPageToken ?? ''
    if (!pageToken) break
  }
  console.log(`search "${artist.name}": ${hits} new results mention an artist`)
}

async function main() {
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is missing from .env')
  const sources: Sources = JSON.parse(readFileSync(SOURCES_PATH, 'utf8'))
  const previous: DjSet[] = JSON.parse(readFileSync(SETS_PATH, 'utf8'))
  const knownPlaces = new Map(previous.filter(s => s.enrichedAt).map(s => [s.id, s]))
  const match = artistMatcher(sources.artists)
  const blocked = new Set(sources.blockedChannels.map(normalize))

  const found = new Map<string, Candidate>()
  for (const channel of sources.channels) await scanChannel(channel, match, found)
  for (const artist of sources.artists) await searchArtist(artist, sources.searchPagesPerArtist, match, found)

  const artistsByName = new Map(sources.artists.map(a => [a.name, a]))
  let kept = 0
  for (const s of previous) {
    const artists = s.artist.split(' & ').map(n => artistsByName.get(n)).filter((a): a is Artist => a !== undefined)
    if (artists.length === 0) continue
    found.set(s.id, { artists: found.get(s.id)?.artists ?? artists, trusted: true })
    kept++
  }
  console.log(`catalogue: ${kept} existing sets re-checked`)
  for (const id of sources.excludedVideos) found.delete(id)

  const minDurationSec = sources.minDurationMin * 60
  const skipped = { notAnArtistSet: 0, blockedChannel: 0, tooShort: 0, lowViews: 0, notEmbeddable: 0, liveOrUpcoming: 0, unavailable: 0 }
  const sets: DjSet[] = []
  const ids = [...found.keys()]
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const page = await youtube<VideosPage>('videos', { part: 'snippet,contentDetails,status,statistics', id: batch.join(',') })
    const videos = new Map(page.items.map(v => [v.id, v]))
    for (const id of batch) {
      const video = videos.get(id)
      const candidate = found.get(id)!
      if (!video) { skipped.unavailable++; continue }
      if (blocked.has(normalize(video.snippet.channelTitle))) { skipped.blockedChannel++; continue }
      if (!isArtistSet(video.snippet.title, video.snippet.channelTitle, candidate)) { skipped.notAnArtistSet++; continue }
      if (video.snippet.liveBroadcastContent !== 'none') { skipped.liveOrUpcoming++; continue }
      if (!video.status.embeddable) { skipped.notEmbeddable++; continue }
      const durationSec = parseIsoDuration(video.contentDetails.duration)
      if (durationSec < minDurationSec) { skipped.tooShort++; continue }
      const views = Number(video.statistics.viewCount ?? 0)
      if (views < sources.minViews) { skipped.lowViews++; continue }
      const known = knownPlaces.get(id)
      sets.push({
        id,
        title: video.snippet.title,
        artist: candidate.artists.map(a => a.name).join(' & '),
        broadcaster: video.snippet.channelTitle,
        ...EMPTY_PLACE,
        ...(known && {
          city: known.city,
          country: known.country,
          venue: known.venue,
          coords: known.coords,
          setting: known.setting,
          enrichedAt: known.enrichedAt,
        }),
        durationSec,
        cues: parseTracklistCues(video.snippet.description, durationSec),
        views,
        genres: [...new Set(candidate.artists.flatMap(a => a.genres))],
        publishedAt: video.snippet.publishedAt,
      })
    }
  }

  sets.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  writeFileSync(SETS_PATH, `${JSON.stringify(sets, null, 2)}\n`)

  console.log(`\nSkipped: ${JSON.stringify(skipped)}`)
  console.log('Sets per artist:')
  for (const a of sources.artists) console.log(`  ${a.name}: ${sets.filter(s => s.artist.includes(a.name)).length}`)
  console.log(`\nWrote ${sets.length} sets from ${new Set(sets.map(s => s.broadcaster)).size} channels. Quota used: ~${quotaUsed} units.`)
}

main().catch((err) => {
  console.error(`Ingest failed, data/sets.json left unchanged: ${err.message}`)
  process.exit(1)
})
