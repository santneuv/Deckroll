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
