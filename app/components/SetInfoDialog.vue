<script setup lang="ts">
const props = defineProps<{ set: DjSet, open: boolean, saved: boolean }>()
const emit = defineEmits<{ close: [], toggleSave: [], play: [set: DjSet] }>()

const dialog = ref<HTMLDialogElement | null>(null)
const moreSets = ref<DjSet[]>([])

const place = computed(() => [props.set.city, props.set.country].filter(Boolean).join(', '))
const artistLabel = computed(() => artistNames(props.set.artist).join(' / '))

watch(() => [props.open, props.set.id] as const, async ([open, id]) => {
  if (!open) return
  moreSets.value = []
  try {
    const res = await $fetch('/api/artist-sets', { query: { artist: props.set.artist, exclude: id } })
    if (props.set.id === id) moreSets.value = res.sets
  }
  catch {
    moreSets.value = []
  }
}, { immediate: true })

function subtitle(set: DjSet) {
  return [set.venue ?? set.broadcaster, set.city].filter(Boolean).join(' · ')
}

watch(() => props.open, (open) => {
  if (open && !dialog.value?.open) dialog.value?.showModal()
  if (!open && dialog.value?.open) dialog.value.close()
}, { flush: 'post' })

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="set-info-title" @close="emit('close')" @click="onBackdropClick">
    <div class="panel">
      <header class="head">
        <div class="head-text">
          <p class="source">{{ set.broadcaster }}</p>
          <h2 id="set-info-title" class="title">{{ set.title }}</h2>
        </div>
        <button type="button" class="close" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <div class="cover">
        <img :src="`https://i.ytimg.com/vi/${set.id}/hqdefault.jpg`" alt="" width="480" height="360">
        <span class="badge">Playing now</span>
      </div>

      <dl class="grid">
        <div class="wide">
          <dt class="label">Location</dt>
          <dd>
            <template v-if="set.venue || place">
              <span v-if="set.venue">{{ set.venue }}</span>
              <span v-if="set.venue && place" class="sep">·</span>
              <span v-if="place">{{ place }}</span>
            </template>
            <span v-else class="unknown">Unknown</span>
          </dd>
        </div>
        <div>
          <dt class="label">Artist</dt>
          <dd>
            <template v-for="(name, i) in artistNames(set.artist)" :key="name">
              <span v-if="i > 0" class="sep">/</span>
              <NuxtLink :to="`/artist/${artistSlug(name)}`" class="artist-link" :title="`All ${name} sets`">{{ name }}</NuxtLink>
            </template>
          </dd>
        </div>
        <div>
          <dt class="label">Runtime</dt>
          <dd>{{ formatDuration(set.durationSec) }}</dd>
        </div>
        <div>
          <dt class="label">Venue type</dt>
          <dd>{{ SETTING_LABELS[set.setting] }}</dd>
        </div>
        <div>
          <dt class="label">Views</dt>
          <dd>{{ formatFullCount(set.views) }}</dd>
        </div>
        <div>
          <dt class="label">Uploaded</dt>
          <dd>{{ set.publishedAt ? formatDate(set.publishedAt) : '—' }}</dd>
        </div>
      </dl>

      <ul class="tags">
        <li v-for="g in set.genres" :key="g" class="chip">{{ g }}</li>
      </ul>

      <section v-if="moreSets.length > 0" class="more">
        <p class="label">More from {{ artistLabel }}</p>
        <ul class="more-list">
          <li v-for="s in moreSets" :key="s.id">
            <button type="button" class="more-item" @click="emit('play', s)">
              <span class="thumb">
                <img :src="`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`" alt="" loading="lazy" width="160" height="90">
                <span class="duration">{{ formatDuration(s.durationSec) }}</span>
              </span>
              <span class="more-text">
                <strong>{{ s.title }}</strong>
                <span>{{ subtitle(s) }}</span>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <footer class="actions">
        <button type="button" class="btn" :class="{ on: saved }" :aria-pressed="saved" @click="emit('toggleSave')">
          {{ saved ? '✓ Saved' : 'Save' }}
        </button>
        <a class="btn" :href="`https://www.youtube.com/watch?v=${set.id}`" target="_blank" rel="noopener">
          Open on YouTube ↗
        </a>
        <button type="button" class="btn primary" @click="emit('close')">Close details</button>
      </footer>

      <ReportForm :key="set.id" :set-id="set.id" />
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid var(--border-strong);
  border-top: 2px solid var(--accent);
  border-radius: var(--radius);
  background: var(--panel);
  color: var(--text);
  overflow-y: auto;
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: blur(2px);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
}

.head-text {
  min-width: 0;
}

.source {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-2);
}

.title {
  margin: 2px 0 0;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.3;
}

.close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: none;
  color: var(--muted);
}

.close:hover {
  border-color: var(--muted);
  color: var(--text);
}

.cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.badge {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 4px 10px;
  border: 1px solid var(--accent-2);
  border-radius: var(--radius);
  background: rgb(10 10 12 / 0.85);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-2);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin: 0;
  background: var(--border);
  border-bottom: 1px solid var(--border);
}

.grid > div {
  padding: 12px 16px;
  background: var(--panel);
  min-width: 0;
}

.grid .wide {
  grid-column: 1 / -1;
}

.grid > div:last-child {
  grid-column: span 2;
}

.grid dd {
  margin: 4px 0 0;
  font-family: var(--mono);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.artist-link {
  text-decoration: none;
}

.artist-link:hover {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.sep {
  margin: 0 6px;
  color: var(--dim);
}

.unknown {
  color: var(--dim);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 12px 16px;
  list-style: none;
  border-bottom: 1px solid var(--border);
}

.tags:empty {
  display: none;
}

.more {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.more .label {
  margin: 0;
}

.more-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.more-item {
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
}

.thumb {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border);
  background: #000;
  overflow: hidden;
}

.more-item:hover .thumb {
  border-color: var(--accent);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.duration {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 0 4px;
  background: rgb(0 0 0 / 0.8);
  font-family: var(--mono);
  font-size: 10px;
}

.more-text {
  display: grid;
  min-width: 0;
}

.more-text > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-text strong {
  font-size: 12px;
}

.more-text span {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--dim);
}

.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 14px 16px;
}

.primary {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.primary:hover {
  background: var(--accent);
  color: var(--bg);
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions {
    grid-template-columns: 1fr;
  }
}
</style>
