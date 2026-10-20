<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker } from 'leaflet'

const siteOrigin = useRuntimeConfig().public.siteUrl
useSeoMeta({
  title: 'Map — Deckroll',
  description: 'Explore full-length DJ sets on a world map: festivals, clubs and radio, city by city.',
  ogTitle: 'Deckroll map — DJ sets around the world',
  ogDescription: 'Explore full-length DJ sets on a world map: festivals, clubs and radio, city by city.',
  ogImage: `${siteOrigin}/og-image.png`,
  ogUrl: `${siteOrigin}/map`,
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: `${siteOrigin}/map` }] })

const { data: cities } = await useFetch('/api/cities')
const { data: facets } = await useFetch('/api/facets')

const mapEl = ref<HTMLDivElement | null>(null)
let map: LeafletMap | null = null
const markers = new Map<string, Marker>()

const query = ref('')
const selected = ref<CityPoint | null>(null)
const citySets = ref<DjSet[]>([])
const loadingCity = ref(false)
const current = ref<DjSet | null>(null)
const startAt = ref(0)
const history = useStoredSets('live-dj:history', 50)

const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return (cities.value ?? [])
    .filter(c => c.city.toLowerCase().includes(q) || (c.country ?? '').toLowerCase().includes(q))
    .slice(0, 8)
})

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[ch]!)

const TILE_SIZE = 256
const MAX_ZOOM = 8
const LABEL_ALL_FROM_ZOOM = 5
const MAJOR_CITY_MIN_SETS = 3

function zoomToFillWidth(el: HTMLElement) {
  return Math.max(2, Math.ceil(Math.log2(el.clientWidth / TILE_SIZE)))
}

onMounted(async () => {
  const [{ default: L }, countries] = await Promise.all([
    import('leaflet'),
    $fetch<GeoJSON.FeatureCollection>('/map/countries.json'),
  ])
  if (!mapEl.value) return
  const minZoom = zoomToFillWidth(mapEl.value)
  map = L.map(mapEl.value, {
    zoomControl: false,
    minZoom,
    maxZoom: MAX_ZOOM,
    maxBounds: [[-75, -180], [85, 180]],
    maxBoundsViscosity: 1,
  }).setView([30, 10], minZoom)
  L.control.zoom({ position: 'topleft' }).addTo(map)
  map.attributionControl.setPrefix(false)
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>')
  L.geoJSON(countries, {
    interactive: false,
    style: { color: '#3a3a45', weight: 0.8, fillColor: '#24242b', fillOpacity: 1 },
  }).addTo(map)
  map.on('resize', () => {
    if (!map || !mapEl.value) return
    map.setMinZoom(zoomToFillWidth(mapEl.value))
  })
  const updateLabelDensity = () => {
    mapEl.value?.classList.toggle('labels-major-only', (map?.getZoom() ?? 0) < LABEL_ALL_FROM_ZOOM)
  }
  map.on('zoomend', updateLabelDensity)
  updateLabelDensity()

  for (const c of cities.value ?? []) {
    const icon = L.divIcon({
      className: c.count >= MAJOR_CITY_MIN_SETS ? 'city-pin' : 'city-pin minor',
      iconSize: [0, 0],
      html: `<span class="city-dot"></span><span class="city-chip"><b>${escapeHtml(c.city)}</b><em>${c.count}</em></span>`,
    })
    const marker = L.marker(c.coords, { icon, title: `${c.city}: ${c.count} sets`, keyboard: true }).addTo(map)
    marker.on('click', () => openCity(c))
    markers.set(c.city, marker)
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

function setActiveMarker(city: string | null) {
  for (const [name, marker] of markers) marker.getElement()?.classList.toggle('active', name === city)
}

async function openCity(c: CityPoint) {
  selected.value = c
  query.value = ''
  setActiveMarker(c.city)
  map?.flyTo(c.coords, Math.max(map.getZoom(), 6), { duration: 0.8 })
  loadingCity.value = true
  citySets.value = []
  try {
    const res = await $fetch('/api/sets', { query: { city: c.city } })
    if (selected.value?.city === c.city) citySets.value = res.sets
  }
  catch {
    citySets.value = []
  }
  finally {
    loadingCity.value = false
  }
}

function closeCity() {
  selected.value = null
  setActiveMarker(null)
}

function play(set: DjSet, start = 0) {
  current.value = set
  startAt.value = start
  history.add(set)
}

function roll(mode: SpinMode) {
  const pool = citySets.value.filter(s => s.id !== current.value?.id)
  const candidates = pool.length > 0 ? pool : citySets.value
  const set = candidates[Math.floor(Math.random() * candidates.length)]
  if (set) play(set, mode === 'drop' ? pickDropPoint(set) : 0)
}

function onSearchEnter() {
  const first = searchResults.value[0]
  if (first) openCity(first)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selected.value) closeCity()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="map-page">
    <AppHeader :total="facets?.total" />

    <div class="map-wrap">
      <div ref="mapEl" class="map" />

      <div class="search">
        <input
          v-model="query"
          type="search"
          placeholder="Search city or country…"
          aria-label="Search city or country"
          @keydown.enter="onSearchEnter"
        >
        <ul v-if="searchResults.length > 0" class="results">
          <li v-for="c in searchResults" :key="c.city">
            <button type="button" @click="openCity(c)">
              <span>{{ c.city }}<small v-if="c.country">, {{ c.country }}</small></span>
              <em>{{ c.count }}</em>
            </button>
          </li>
        </ul>
        <p v-else-if="query.trim()" class="no-results">No city found</p>
      </div>

      <CityPanel
        v-if="selected"
        class="city-panel"
        :city="selected"
        :sets="citySets"
        :loading="loadingCity"
        :active-id="current?.id"
        @close="closeCity"
        @play="play"
        @roll="roll"
      />

      <MiniPlayer v-if="current" class="mini-player" :set="current" :start="startAt" @close="current = null" />
    </div>
  </div>
</template>

<style scoped>
.map-page {
  height: 100vh;
  height: 100dvh;
  display: grid;
  grid-template-rows: var(--header-h) minmax(0, 1fr);
}

.map-wrap {
  position: relative;
  min-height: 0;
}

.map {
  position: absolute;
  inset: 0;
}

.search {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 500;
  width: min(340px, calc(100% - 24px));
}

.search input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: rgb(15 15 18 / 0.95);
  font-family: var(--mono);
  font-size: 13px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
}

.search input:focus {
  border-color: var(--accent);
  outline: none;
}

.results,
.no-results {
  margin: 4px 0 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: rgb(15 15 18 / 0.97);
}

.results {
  padding: 4px 0;
  list-style: none;
}

.results button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  background: none;
  font-family: var(--mono);
  font-size: 12px;
  text-align: left;
}

.results button:hover {
  background: var(--surface-2);
}

.results small {
  color: var(--dim);
}

.results em {
  font-style: normal;
  color: var(--accent-2);
}

.no-results {
  padding: 8px 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

.city-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 500;
  width: 380px;
}

.mini-player {
  position: absolute;
  left: 12px;
  bottom: 24px;
  z-index: 600;
}

@media (max-width: 900px) {
  .city-panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    height: 55%;
  }

  .mini-player {
    top: 64px;
    left: 12px;
    right: 12px;
    bottom: auto;
    width: auto;
  }
}
</style>

<style>
.leaflet-container {
  background: #0c0c0f;
  font-family: var(--mono);
}

.leaflet-top.leaflet-left {
  top: 60px;
}

.labels-major-only .city-pin.minor:not(:hover, .active) .city-chip {
  display: none;
}

@media (max-width: 900px) {
  .leaflet-control-zoom {
    display: none;
  }
}

.leaflet-control-attribution {
  background: rgb(10 10 12 / 0.75) !important;
  color: var(--dim) !important;
  font-size: 10px;
}

.leaflet-control-attribution a {
  color: var(--muted) !important;
}

.leaflet-bar a {
  background: var(--surface) !important;
  border-color: var(--border-strong) !important;
  color: var(--text) !important;
}

.city-pin {
  position: relative;
}

.city-pin:hover,
.city-pin.active {
  z-index: 10000 !important;
}

.city-dot {
  position: absolute;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-2);
  box-shadow: 0 0 8px var(--accent-2);
}

.city-chip {
  position: absolute;
  left: 8px;
  top: -11px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px;
  border: 1px solid var(--border-strong);
  border-left: 3px solid var(--accent-2);
  background: rgb(10 10 12 / 0.92);
  color: var(--text);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
}

.city-chip em {
  font-style: normal;
  color: var(--accent-2);
}

.city-pin:hover .city-chip,
.city-pin.active .city-chip {
  border-color: var(--accent);
  border-left-color: var(--accent);
}

.city-pin.active .city-dot {
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}
</style>
