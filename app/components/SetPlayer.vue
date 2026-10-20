<script setup lang="ts">
const props = withDefaults(defineProps<{ set: DjSet | null, start?: number }>(), { start: 0 })

const embedUrl = computed(() => {
  if (!props.set) return null
  const start = props.start > 0 ? `&start=${props.start}` : ''
  return `https://www.youtube-nocookie.com/embed/${props.set.id}?autoplay=1&rel=0${start}`
})
</script>

<template>
  <div class="frame">
    <div class="player">
      <iframe
        v-if="embedUrl"
        :key="embedUrl"
        :src="embedUrl"
        :title="set?.title"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      />
      <div v-else class="standby">
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

iframe {
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
