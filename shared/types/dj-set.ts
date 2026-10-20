export type Setting =
  | 'club'
  | 'festival'
  | 'warehouse'
  | 'outdoor'
  | 'arena'
  | 'radio_studio'
  | 'record_store'
  | 'other'

export interface DjSet {
  /** YouTube video ID */
  id: string
  title: string
  artist: string
  broadcaster: string
  city: string | null
  country: string | null
  /** Venue or event name, e.g. "Tomorrowland" */
  venue: string | null
  /** [lat, lng] */
  coords: [number, number] | null
  durationSec: number
  /** Track start times (seconds) parsed from the description's tracklist; empty when there is none */
  cues: number[]
  views: number
  genres: string[]
  setting: Setting
  /** ISO date; null when unknown */
  publishedAt: string | null
  /** When the place fields were extracted; null means not processed yet */
  enrichedAt: string | null
}

/** "random" plays a set from the start, "drop" starts it somewhere in the middle */
export type SpinMode = 'random' | 'drop'

/** Empty list means "any"; several values in one list match any of them */
export interface SetFilters {
  genres: string[]
  cities: string[]
  broadcasters: string[]
  settings: string[]
}

export interface FacetCount {
  name: string
  count: number
}

export interface Facets {
  total: number
  genres: FacetCount[]
  cities: FacetCount[]
  broadcasters: FacetCount[]
  settings: FacetCount[]
}
