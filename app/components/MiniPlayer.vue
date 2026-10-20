<script setup lang="ts">
const props = defineProps<{ set: DjSet, start: number }>()
const emit = defineEmits<{ close: [] }>()

const roulettePath = computed(() => {
  const t = props.start > 0 ? `&t=${props.start}` : ''
  return `/?set=${props.set.id}${t}`
})
const subtitle = computed(() => [props.set.artist, props.set.venue ?? props.set.broadcaster].join(' · '))
</script>

<template>
  <section class="mini" aria-label="Now playing">
    <div class="video">
      <SetPlayer :set="set" :start="start" />
    </div>
    <div class="bar">
      <div class="text">
        <strong :title="set.title">{{ set.title }}</strong>
        <span>{{ subtitle }}</span>
      </div>
      <NuxtLink :to="roulettePath" class="icon-btn" title="Open in Roulette">↗</NuxtLink>
      <button type="button" class="icon-btn" aria-label="Close player" @click="emit('close')">✕</button>
    </div>
  </section>
</template>

<style scoped>
.mini {
  width: 400px;
  border: 1px solid var(--border-strong);
  border-top: 2px solid var(--accent);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.6);
  overflow: hidden;
}

.video {
  height: 225px;
  display: flex;
}

.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid var(--border);
}

.text {
  display: grid;
  flex: 1;
  min-width: 0;
}

.text > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text strong {
  font-family: var(--mono);
  font-size: 12px;
}

.text span {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--accent-2);
}

.icon-btn {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: none;
  color: var(--muted);
  text-decoration: none;
}

.icon-btn:hover {
  border-color: var(--muted);
  color: var(--text);
}

@media (max-width: 900px) {
  .mini {
    width: 100%;
  }

  .video {
    display: block;
    height: auto;
  }
}
</style>
