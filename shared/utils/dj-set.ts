export const SETTING_LABELS: Record<Setting, string> = {
  club: 'Club',
  festival: 'Festival',
  warehouse: 'Warehouse',
  outdoor: 'Outdoor',
  arena: 'Arena',
  radio_studio: 'Radio studio',
  record_store: 'Record store',
  other: 'Other',
}

export const DURATION_LABELS: Record<DurationBucket, string> = {
  short: 'Up to 1h',
  medium: '1–2h',
  long: '2h+',
}

/** Festival slots often run a few minutes over the hour, so each bucket allows 5 minutes of slack */
export function durationBucket(durationSec: number): DurationBucket {
  const min = durationSec / 60
  return min <= 65 ? 'short' : min <= 125 ? 'medium' : 'long'
}

export const REPORT_REASONS: Record<ReportReason, string> = {
  'audience': 'Audience / phone recording',
  'unplayable': 'Won\'t play',
  'wrong-info': 'Wrong artist or location',
  'not-a-set': 'Not a full DJ set',
  'other': 'Something else',
}

/** Not "&", which is part of names like "Above & Beyond" */
export const ARTIST_SEPARATOR = ' b2b '

/** b2b sets list every artist: "ARTBAT b2b Armin van Buuren" */
export const artistNames = (artist: string) => artist.split(ARTIST_SEPARATOR)

/** "Tiësto" -> "tiesto", "Armin van Buuren" -> "armin-van-buuren" */
export function artistSlug(name: string): string {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const fullNumber = new Intl.NumberFormat('en')
const mediumDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })

/** 206282 -> "206,282" */
export function formatFullCount(n: number): string {
  return fullNumber.format(n)
}

/** "2024-07-26T18:00:00Z" -> "Jul 26, 2024" */
export function formatDate(iso: string): string {
  return mediumDate.format(new Date(iso))
}

const DROP_WINDOW = [0.15, 0.85] as const

/** A start time inside the set's main body: a random track start when there is a tracklist, otherwise a random second */
export function pickDropPoint(set: DjSet): number {
  const [from, to] = DROP_WINDOW.map(f => Math.floor(set.durationSec * f)) as [number, number]
  const tracks = set.cues.filter(c => c >= from && c <= to)
  if (tracks.length > 0) return tracks[Math.floor(Math.random() * tracks.length)]!
  return from + Math.floor(Math.random() * (to - from))
}

/** 3725 -> "1:02:05", 2780 -> "46:20" */
export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}
