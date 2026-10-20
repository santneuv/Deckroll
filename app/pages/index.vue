<script setup lang="ts">
const RECENT_TO_SKIP = 20

const route = useRoute()
const router = useRouter()

const { data: facets } = await useFetch('/api/facets')

const filters = ref<SetFilters>({ genres: [], settings: [], broadcasters: [], cities: [] })
const filterQuery = computed(() => ({
  genre: filters.value.genres,
  setting: filters.value.settings,
  broadcaster: filters.value.broadcasters,
  city: filters.value.cities,
}))
const { data: pool } = await useFetch('/api/count', { query: filterQuery })

const MAX_SKIPS_IN_A_ROW = 3
const RADIO_STORAGE_KEY = 'live-dj:radio'

const current = ref<DjSet | null>(null)
const startAt = ref(0)
const sharedId = typeof route.query.set === 'string' ? route.query.set : null
if (sharedId) {
  const { data } = await useFetch<DjSet>(`/api/sets/${encodeURIComponent(sharedId)}`)
  current.value = data.value ?? null
  const t = Math.floor(Number(route.query.t))
  if (current.value && t > 0 && t < current.value.durationSec) startAt.value = t
}

const spinning = ref(false)
const notice = ref('')
const drawerOpen = ref(false)
const infoOpen = ref(false)
const drawerTab = ref<'saved' | 'history'>('saved')
const radio = ref(false)
let skipsInARow = 0

const history = useStoredSets('live-dj:history', 50)
const saved = useStoredSets('live-dj:saved', 200)

const siteOrigin = useRuntimeConfig().public.siteUrl
const DEFAULT_TITLE = 'Deckroll — random DJ sets'
const DEFAULT_DESCRIPTION = 'Roll for a random full-length DJ set. Filter by genre, city, source and venue, or drop in mid-set.'

const shareTitle = computed(() => (current.value ? `${current.value.artist} — ${current.value.title}` : DEFAULT_TITLE))
const shareDescription = computed(() => {
  const set = current.value
  if (!set) return DEFAULT_DESCRIPTION
  const place = [set.venue, [set.city, set.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')
  return [place, formatDuration(set.durationSec), 'Roll a random DJ set on Deckroll'].filter(Boolean).join(' · ')
})

useSeoMeta({
  title: () => (current.value ? `${shareTitle.value} | Deckroll` : DEFAULT_TITLE),
  description: shareDescription,
  ogTitle: shareTitle,
  ogDescription: shareDescription,
  ogType: 'website',
  ogUrl: () => `${siteOrigin}${route.fullPath}`,
  ogImage: () => (current.value ? `https://i.ytimg.com/vi/${current.value.id}/hqdefault.jpg` : `${siteOrigin}/og-image.png`),
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: () => `${siteOrigin}${current.value ? `/?set=${current.value.id}` : '/'}` }],
})

let noticeTimer: ReturnType<typeof setTimeout> | undefined
function flash(message: string) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 2500)
}

async function spin(mode: SpinMode = 'random') {
  if (spinning.value) return
  spinning.value = true
  try {
    const res = await $fetch('/api/spin', {
      query: { ...filterQuery.value, exclude: history.items.value.slice(0, RECENT_TO_SKIP).map(s => s.id) },
    })
    if (!res.set) {
      flash('No sets match these filters')
      return
    }
    const start = mode === 'drop' ? pickDropPoint(res.set) : 0
    play(res.set, start)
    if (start > 0) flash(`Dropped in at ${formatDuration(start)}`)
  }
  catch {
    flash('Could not reach the server. Try again.')
  }
  finally {
    spinning.value = false
  }
}

function syncUrl(set: DjSet, start: number) {
  router.replace({ query: start > 0 ? { set: set.id, t: String(start) } : { set: set.id } })
}

function play(set: DjSet, start = 0) {
  current.value = set
  startAt.value = start
  history.add(set)
  syncUrl(set, start)
}

function restart() {
  if (!current.value) return
  startAt.value = 0
  syncUrl(current.value, 0)
}

function playFromDrawer(set: DjSet) {
  play(set)
  drawerOpen.value = false
}

function playFromDialog(set: DjSet) {
  play(set)
  infoOpen.value = false
}

function onSetEnded() {
  if (radio.value) spin('random')
}

function onSetError() {
  if (radio.value && skipsInARow < MAX_SKIPS_IN_A_ROW) {
    skipsInARow++
    flash('This set can\'t be played here, skipping')
    spin('random')
  }
  else {
    flash('This set can\'t be played here. Roll another one.')
  }
}

function toggleSaved(set: DjSet) {
  if (saved.has(set.id)) saved.remove(set.id)
  else saved.add(set)
}

function toggleFilter(key: keyof SetFilters, value: string) {
  const list = filters.value[key]
  const active = list.includes(value)
  filters.value = { ...filters.value, [key]: active ? list.filter(v => v !== value) : [...list, value] }
  const label = key === 'settings' ? SETTING_LABELS[value as Setting] : value
  flash(active ? `Removed filter: ${label}` : `Filtering by ${label}`)
}

function openDrawer(tab: 'saved' | 'history') {
  drawerTab.value = tab
  drawerOpen.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && drawerOpen.value) {
    drawerOpen.value = false
    return
  }
  const key = e.key.toLowerCase()
  if (infoOpen.value || (key !== 'r' && key !== 'd') || e.ctrlKey || e.metaKey || e.altKey) return
  if ((e.target as HTMLElement | null)?.closest('input, select, textarea, [contenteditable]')) return
  e.preventDefault()
  spin(key === 'd' ? 'drop' : 'random')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  try {
    radio.value = localStorage.getItem(RADIO_STORAGE_KEY) === 'on'
  }
  catch {
    radio.value = false
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

watch(radio, (on) => {
  try {
    localStorage.setItem(RADIO_STORAGE_KEY, on ? 'on' : 'off')
  }
  catch {
    // Storage unavailable: the toggle still works for this visit.
  }
})
</script>

<template>
  <div class="app">
    <AppHeader :total="facets?.total">
      <button type="button" class="btn top-btn" @click="openDrawer('history')">
        History <span class="top-count">{{ history.items.value.length }}</span>
      </button>
      <button type="button" class="btn top-btn" @click="openDrawer('saved')">
        Saved <span class="top-count pink">{{ saved.items.value.length }}</span>
      </button>
    </AppHeader>

    <div class="shell">
      <aside class="side">
        <SidebarFilters
          v-if="facets"
          v-model="filters"
          v-model:radio="radio"
          :facets="facets"
          :matches="pool?.matches ?? null"
          :spinning="spinning"
          :idle="!current"
          @spin="spin"
        />
      </aside>

      <main class="stage">
        <div class="content">
          <SetPlayer
            :set="current"
            :start="startAt"
            @ended="onSetEnded"
            @playing="skipsInARow = 0"
            @error="onSetError"
          />
          <SetDetails
            v-if="current"
            :set="current"
            :saved="saved.has(current.id)"
            :filters="filters"
            :start-at="startAt"
            @restart="restart"
            @toggle-save="toggleSaved(current)"
            @open-info="infoOpen = true"
            @toggle-filter="toggleFilter"
          />
          <SetInfoDialog
            v-if="current"
            :set="current"
            :open="infoOpen"
            :saved="saved.has(current.id)"
            @close="infoOpen = false"
            @toggle-save="toggleSaved(current)"
            @play="playFromDialog"
          />
        </div>
      </main>
    </div>

    <SetDrawer
      v-model:tab="drawerTab"
      :open="drawerOpen"
      :history="history.items.value"
      :saved="saved.items.value"
      :active-id="current?.id"
      @close="drawerOpen = false"
      @play="playFromDrawer"
    />

    <div class="mobile-spin">
      <button type="button" :disabled="spinning" @click="spin('random')">
        <AppLogo :size="20" />
        Random set
      </button>
      <button type="button" class="drop" :disabled="spinning" @click="spin('drop')">
        ⚡ Drop in
      </button>
    </div>

    <p v-if="notice" class="toast" role="status">{{ notice }}</p>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  height: 100dvh;
  display: grid;
  grid-template-rows: var(--header-h) minmax(0, 1fr);
  overflow: hidden;
}

.top-btn {
  padding: 0.45rem 0.8rem;
  font-size: 11px;
}

.top-count {
  color: var(--muted);
}

.top-count.pink {
  color: var(--accent-2);
}

.shell {
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
}

.side {
  min-height: 0;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  background: var(--panel);
  scrollbar-width: thin;
}

.stage {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 14px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 30;
  transform: translateX(-50%);
  margin: 0;
  padding: 10px 16px;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--surface-2);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
}

.mobile-spin {
  display: none;
}

@media (max-width: 900px) {
  .app {
    height: auto;
    display: block;
    overflow: visible;
    padding-bottom: 72px;
  }

  .shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .side {
    overflow: visible;
    border-right: 0;
    border-top: 1px solid var(--border);
  }

  .stage {
    order: -1;
  }

  .content {
    padding: 16px;
  }

  .mobile-spin {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 8px;
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 12px;
    z-index: 10;
  }

  .mobile-spin button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 8px;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--bg);
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.6);
  }

  .mobile-spin .drop {
    border-color: var(--accent-2);
    background: var(--bg);
    color: var(--accent-2);
  }

  .toast {
    bottom: 84px;
  }
}
</style>
