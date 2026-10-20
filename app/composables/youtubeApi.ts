export interface YouTubePlayer {
  loadVideoById(options: { videoId: string, startSeconds?: number }): void
  destroy(): void
}

interface YouTubePlayerOptions {
  host?: string
  videoId: string
  width?: string
  height?: string
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: () => void
    onStateChange?: (e: { data: number }) => void
    onError?: (e: { data: number }) => void
  }
}

interface YouTubeNamespace {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

export const YT_STATE_ENDED = 0
export const YT_STATE_PLAYING = 1

let loading: Promise<YouTubeNamespace> | null = null

export function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  loading ??= new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve(window.YT!)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('YouTube player API failed to load'))
    }
    document.head.appendChild(script)
  })
  return loading
}
