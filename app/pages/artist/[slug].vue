<script setup lang="ts">
type SortKey = 'popular' | 'newest' | 'longest'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: facets } = await useFetch('/api/facets')
const { data: artist, error } = await useFetch(() => `/api/artists/${slug.value}`)
if (error.value || !artist.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artist not found', fatal: true })
}

const SORTS: { key: SortKey, label: string }[] = [
  { key: 'popular', label: 'Most viewed' },
  { key: 'newest', label: 'Newest' },
  { key: 'longest', label: 'Longest' },
]
const sort = ref<SortKey>('popular')

const sets = computed(() => artist.value?.sets ?? [])
const sortedSets = computed(() => {
  const list = [...sets.value]
  if (sort.value === 'newest') list.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  if (sort.value === 'longest') list.sort((a, b) => b.durationSec - a.durationSec)
  return list
})
const totalHours = computed(() => Math.round(sets.value.reduce((sum, s) => sum + s.durationSec, 0) / 3600))

const siteOrigin = useRuntimeConfig().public.siteUrl
const name = computed(() => artist.value?.name ?? '')
const description = computed(() => {
  const venues = [...new Set(sets.value.map(s => s.venue).filter(Boolean))].slice(0, 3)
  return `${sets.value.length} full-length ${name.value} DJ sets${venues.length ? `, from ${venues.join(', ')} and more` : ''}. Roll a random one on Deckroll.`
})

useSeoMeta({
  title: () => `${name.value} DJ sets — Deckroll`,
  description,
  ogTitle: () => `${name.value} DJ sets on Deckroll`,
  ogDescription: description,
  ogType: 'website',
  ogUrl: () => `${siteOrigin}/artist/${slug.value}`,
  ogImage: () => (sets.value[0] ? `https://i.ytimg.com/vi/${sets.value[0].id}/hqdefault.jpg` : `${siteOrigin}/og-image.png`),
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: () => `${siteOrigin}/artist/${slug.value}` }] })

function roll(mode: SpinMode) {
  const set = sets.value[Math.floor(Math.random() * sets.value.length)]
  if (!set) return
  const start = mode === 'drop' ? pickDropPoint(set) : 0
  navigateTo({ path: '/', query: start > 0 ? { set: set.id, t: String(start) } : { set: set.id } })
}

function subtitle(set: DjSet) {
  return [set.venue ?? set.broadcaster, set.city].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="artist-page">
    <AppHeader :total="facets?.total" />

    <main v-if="artist" class="page">
      <section class="hero">
        <p class="label">Artist</p>
        <h1 class="name">{{ artist.name }}</h1>
        <p class="stats">
          <strong>{{ sets.length }}</strong> sets
          <span class="sep">·</span>
          <strong>{{ totalHours }}</strong> hours
        </p>
        <ul class="tags">
          <li v-for="g in artist.genres" :key="g" class="chip">{{ g }}</li>
        </ul>
        <div class="rolls">
          <button type="button" class="roll" @click="roll('random')">
            <AppLogo :size="20" />
            Random {{ artist.name }} set
          </button>
          <button type="button" class="roll drop" @click="roll('drop')">
            <span aria-hidden="true">⚡</span>
            Drop in
          </button>
        </div>
      </section>

      <section class="sets">
        <div class="sets-head">
          <h2 class="label">All sets</h2>
          <div class="sorts" role="group" aria-label="Sort sets">
            <button
              v-for="s in SORTS"
              :key="s.key"
              type="button"
              class="chip"
              :class="{ on: sort === s.key }"
              :aria-pressed="sort === s.key"
              @click="sort = s.key"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <ul class="grid">
          <li v-for="s in sortedSets" :key="s.id">
            <NuxtLink :to="{ path: '/', query: { set: s.id } }" class="card">
              <span class="thumb">
                <img :src="`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`" alt="" loading="lazy" width="320" height="180">
                <span class="duration">{{ formatDuration(s.durationSec) }}</span>
              </span>
              <span class="card-text">
                <strong>{{ s.title }}</strong>
                <span>{{ subtitle(s) }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.hero {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.hero p {
  margin: 0;
}

.name {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.stats {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
}

.stats strong {
  color: var(--accent-2);
}

.sep {
  margin: 0 8px;
  color: var(--dim);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rolls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.roll {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--accent);
  color: var(--bg);
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: 0 0 28px rgb(198 255 61 / 0.3);
}

.roll:hover {
  filter: brightness(1.08);
}

.roll.drop {
  border-color: var(--accent-2);
  background: transparent;
  color: var(--accent-2);
  box-shadow: none;
}

.roll.drop:hover {
  filter: none;
  background: var(--accent-2-soft);
}

.sets {
  display: grid;
  gap: 16px;
}

.sets-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.sets-head .label {
  margin: 0;
}

.sorts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  display: grid;
  gap: 8px;
  text-decoration: none;
}

.thumb {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border);
  background: #000;
  overflow: hidden;
}

.card:hover .thumb {
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
  right: 6px;
  bottom: 6px;
  padding: 0 5px;
  background: rgb(0 0 0 / 0.8);
  font-family: var(--mono);
  font-size: 11px;
}

.card-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.card-text strong {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.35;
}

.card:hover .card-text strong {
  color: var(--accent);
}

.card-text span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}

@media (max-width: 560px) {
  .page {
    padding: 24px 16px 40px;
  }

  .rolls,
  .roll {
    width: 100%;
  }

  .roll {
    justify-content: center;
  }

  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
