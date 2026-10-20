<script setup lang="ts">
const props = withDefaults(defineProps<{ set: DjSet | null, start?: number }>(), { start: 0 })
const emit = defineEmits<{ ended: [], playing: [], error: [code: number] }>()

const host = ref<HTMLDivElement | null>(null)
let player: YouTubePlayer | null = null
let ready = false
let pending: { videoId: string, startSeconds: number } | null = null

async function show(videoId: string, startSeconds: number) {
  if (player) {
    if (ready) player.loadVideoById({ videoId, startSeconds })
    else pending = { videoId, startSeconds }
    return
  }
  let YT
  try {
    YT = await loadYouTubeApi()
  }
  catch {
    emit('error', -1)
    return
  }
  if (player || !host.value) return
  const target = document.createElement('div')
  host.value.appendChild(target)
  player = new YT.Player(target, {
    host: 'https://www.youtube-nocookie.com',
    videoId,
    width: '100%',
    height: '100%',
    playerVars: { autoplay: 1, rel: 0, playsinline: 1, start: startSeconds },
    events: {
      onReady: () => {
        ready = true
        if (pending) player?.loadVideoById(pending)
        pending = null
      },
      onStateChange: (e) => {
        if (e.data === YT_STATE_ENDED) emit('ended')
        if (e.data === YT_STATE_PLAYING) emit('playing')
      },
      onError: e => emit('error', e.data),
    },
  })
}

onMounted(() => {
  if (props.set) show(props.set.id, props.start)
})

watch(() => [props.set?.id, props.start] as const, ([id, start]) => {
  if (id) show(id, start)
})

onBeforeUnmount(() => {
  player?.destroy()
  player = null
})
</script>

<template>
  <div class="frame">
    <div class="player">
      <div v-show="set" ref="host" class="host" />
      <div v-if="!set" class="standby">
        <p class="standby-title">No signal</p>
        <p class="standby-sub">
          Hit <strong>Random set</strong> <kbd>R</kbd> or <strong class="pink">Drop in</strong> <kbd>D</kbd> to pull a set
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.frame {
  flex: 1;
  min-height: 0;
  display: flex;
}

.player {
  flex: 1;
  border: 1px solid var(--border);
  background: #000;
  overflow: hidden;
}

.host {
  width: 100%;
  height: 100%;
}

.host :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.standby {
  height: 100%;
  display: grid;
  place-content: center;
  gap: 8px;
  text-align: center;
  background:
    repeating-linear-gradient(0deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px),
    radial-gradient(ellipse at center, #15151a 0%, #050506 75%);
}

.standby p {
  margin: 0;
}

.standby-title {
  font-family: var(--mono);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--text);
  text-shadow: 0 0 18px rgb(198 255 61 / 0.25);
}

.standby-sub {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.standby-sub strong {
  color: var(--accent);
}

.standby-sub .pink {
  color: var(--accent-2);
}

@media (max-width: 900px) {
  .frame {
    flex: none;
  }

  .player {
    aspect-ratio: 16 / 9;
  }
}
</style>
