<script setup lang="ts">
type FilterKey = keyof SetFilters

const props = defineProps<{ facets: Facets, matches: number | null, spinning: boolean }>()
const filters = defineModel<SetFilters>({ required: true })
defineEmits<{ spin: [mode: SpinMode] }>()

const searches = reactive<Record<FilterKey, string>>({ genres: '', settings: '', broadcasters: '', cities: '' })

const settingLabel = (name: string) => SETTING_LABELS[name as Setting] ?? name

const sections = computed(() => [
  { key: 'genres' as const, label: 'Genres', options: props.facets.genres, limit: 10, searchable: true },
  { key: 'settings' as const, label: 'Venue', options: props.facets.settings, limit: Number.POSITIVE_INFINITY, searchable: false },
  { key: 'broadcasters' as const, label: 'Sources', options: props.facets.broadcasters, limit: 8, searchable: true },
  { key: 'cities' as const, label: 'Browse by city', options: props.facets.cities, limit: 12, searchable: true },
])

const hasAnyFilter = computed(() => Object.values(filters.value).some(v => v.length > 0))

function update(key: FilterKey, values: string[]) {
  filters.value = { ...filters.value, [key]: values }
}

function clear(key: FilterKey) {
  update(key, [])
  searches[key] = ''
}

function clearAll() {
  filters.value = { genres: [], settings: [], broadcasters: [], cities: [] }
}
</script>

<template>
  <div class="sidebar">
    <section class="block">
      <p class="label selector-label">Set selector</p>
      <div class="spin-row">
        <button type="button" class="spin" :disabled="spinning" title="Random set from the start (R)" @click="$emit('spin', 'random')">
          <AppLogo :size="20" />
          Random set
        </button>
        <button type="button" class="spin drop" :disabled="spinning" title="Random set, mid-set (D)" @click="$emit('spin', 'drop')">
          <span class="bolt" aria-hidden="true">⚡</span>
          Drop in
        </button>
      </div>
      <div class="pool">
        <span class="label">In the pool</span>
        <span class="pool-count">
          <strong>{{ matches ?? facets.total }}</strong>
          <span>of {{ facets.total }}</span>
        </span>
      </div>
      <p class="hint">
        <span><kbd>R</kbd> random · <kbd>D</kbd> drop in</span>
        <button v-if="hasAnyFilter" type="button" class="text-btn" @click="clearAll">Reset filters</button>
      </p>
    </section>

    <section v-for="s in sections" :key="s.key" class="block">
      <div class="block-head">
        <p class="label">{{ s.label }}</p>
        <button v-if="filters[s.key].length > 0" type="button" class="text-btn" @click="clear(s.key)">Clear</button>
      </div>
      <input
        v-if="s.searchable"
        v-model="searches[s.key]"
        type="search"
        class="search"
        :placeholder="`Search ${s.label.toLowerCase()}…`"
        :aria-label="`Search ${s.label.toLowerCase()}`"
      >
      <ChipGroup
        :model-value="filters[s.key]"
        :options="s.options"
        :limit="s.limit"
        :search="searches[s.key]"
        :format="s.key === 'settings' ? settingLabel : undefined"
        @update:model-value="update(s.key, $event)"
      />
    </section>
  </div>
</template>

<style scoped>
.sidebar {
  display: grid;
}

.block {
  display: grid;
  gap: 12px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--border);
}

.block p {
  margin: 0;
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spin-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.spin {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px 8px;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 0 24px rgb(198 255 61 / 0.12), inset 0 -3px 0 rgb(198 255 61 / 0.25);
  transition: background 0.15s, color 0.15s;
}

.spin:hover:not(:disabled) {
  background: var(--accent);
  color: var(--bg);
}

.spin.drop {
  border-color: var(--accent-2);
  background: var(--accent-2-soft);
  color: var(--accent-2);
  box-shadow: 0 0 24px rgb(255 61 139 / 0.12), inset 0 -3px 0 rgb(255 61 139 / 0.25);
}

.spin.drop:hover:not(:disabled) {
  background: var(--accent-2);
  color: var(--bg);
}

.bolt {
  font-size: 16px;
  line-height: 1;
}

.spin:disabled {
  opacity: 0.7;
  cursor: progress;
}

.pool {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.pool-count {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}

.pool-count strong {
  margin-right: 4px;
  font-size: 22px;
  color: var(--accent-2);
}

.hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}

.text-btn {
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
}

.text-btn:hover {
  color: var(--accent);
}

.search {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-family: var(--mono);
  font-size: 12px;
}

.search:focus {
  border-color: var(--accent);
  outline: none;
}

.search::placeholder {
  color: var(--dim);
}

@media (max-width: 900px) {
  .spin-row,
  .selector-label {
    display: none;
  }
}
</style>
