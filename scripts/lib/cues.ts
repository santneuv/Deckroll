const TIMESTAMP = /(?:^|[^\d:])(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?![\d:])/
const MIN_TRACKLIST_LENGTH = 3

export function parseTracklistCues(description: string, durationSec: number): number[] {
  const cues: number[] = []
  for (const line of description.split('\n')) {
    const m = line.match(TIMESTAMP)
    if (!m) continue
    const [h, min, s] = [Number(m[1] ?? 0), Number(m[2]), Number(m[3])]
    if (min > 59 || s > 59) continue
    const sec = h * 3600 + min * 60 + s
    if (sec < durationSec) cues.push(sec)
  }
  const strictlyIncreasing = cues.every((c, i) => i === 0 || c > cues[i - 1]!)
  return cues.length >= MIN_TRACKLIST_LENGTH && strictlyIncreasing ? cues : []
}
