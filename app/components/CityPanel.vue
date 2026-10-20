<script setup lang="ts">
defineProps<{ city: CityPoint, sets: DjSet[], loading: boolean, activeId?: string }>()
const emit = defineEmits<{ close: [], play: [set: DjSet], roll: [mode: SpinMode] }>()
</script>

<template>
  <aside class="panel" :aria-label="`Sets in ${city.city}`">
    <header class="head">
      <div>
        <p class="label">{{ city.country }}</p>
        <h2 class="city">{{ city.city }} <span class="count">{{ city.count }} sets</span></h2>
      </div>
      <button type="button" class="close" aria-label="Close" @click="emit('close')">✕</button>
    </header>

    <div class="rolls">
      <button type="button" class="roll" :disabled="sets.length === 0" @click="emit('roll', 'random')">
        <AppLogo :size="18" /> Random set
      </button>
      <button type="button" class="roll drop" :disabled="sets.length === 0" @click="emit('roll', 'drop')">
        ⚡ Drop in
      </button>
    </div>

    <p v-if="loading" class="empty">Loading…</p>
    <ul v-else class="rows">
      <li v-for="s in sets" :key="s.id">
        <button type="button" class="row" :class="{ active: s.id === activeId }" @click="emit('play', s)">
          <img :src="`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`" alt="" loading="lazy" width="96" height="54">
          <span class="text">
            <strong>{{ s.title }}</strong>
            <span>{{ s.venue ?? s.broadcaster }} · {{ formatDuration(s.durationSec) }}</span>
          </span>
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border-strong);
  border-top: 2px solid var(--accent-2);
  border-radius: var(--radius);
  background: rgb(15 15 18 / 0.96);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.5);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 10px;
}

.head .label {
  margin: 0;
}

.city {
  margin: 2px 0 0;
  font-size: 1.3rem;
  font-weight: 800;
  text-transform: uppercase;
}

.count {
  margin-left: 6px;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--accent-2);
  text-transform: none;
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

.rolls {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 8px;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--border);
}

.roll {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 6px;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  background: var(--accent);
  color: var(--bg);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.roll.drop {
  border-color: var(--accent-2);
  background: transparent;
  color: var(--accent-2);
}

.roll:disabled {
  opacity: 0.5;
  cursor: default;
}

.empty {
  margin: 0;
  padding: 16px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

.rows {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
}

.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: none;
  text-align: left;
}

.row:hover,
.row.active {
  background: var(--surface);
}

.row.active {
  box-shadow: inset 2px 0 0 var(--accent);
}

.row img {
  flex-shrink: 0;
  width: 96px;
  height: 54px;
  object-fit: cover;
  border: 1px solid var(--border);
}

.text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.text strong {
  font-size: 13px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.text span {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
