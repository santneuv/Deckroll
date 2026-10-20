<script setup lang="ts">
const props = defineProps<{ open: boolean, history: DjSet[], saved: DjSet[], activeId?: string }>()
const emit = defineEmits<{ close: [], play: [set: DjSet] }>()
const tab = defineModel<'saved' | 'history'>('tab', { required: true })

const closeButton = ref<HTMLButtonElement | null>(null)
const rows = computed(() => (tab.value === 'saved' ? props.saved : props.history))

watch(() => props.open, async (open) => {
  if (!open) return
  await nextTick()
  closeButton.value?.focus()
})

function subtitle(set: DjSet) {
  const place = [set.city, set.country].filter(Boolean).join(', ')
  return [set.broadcaster, place].filter(Boolean).join(' • ')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="backdrop" @click="emit('close')" />
  </Transition>
  <Transition name="slide">
    <aside v-if="open" class="drawer" role="dialog" aria-modal="true" :aria-label="tab === 'saved' ? 'Saved sets' : 'History'">
      <header class="head">
        <p class="title">{{ tab === 'saved' ? 'Saved' : 'History' }}</p>
        <button ref="closeButton" type="button" class="close" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <div class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'saved'" @click="tab = 'saved'">
          ★ Saved <span class="badge pink">{{ saved.length }}</span>
        </button>
        <button type="button" role="tab" :aria-selected="tab === 'history'" @click="tab = 'history'">
          ◷ History <span class="badge">{{ history.length }}</span>
        </button>
      </div>

      <p v-if="rows.length === 0" class="empty">
        {{ tab === 'saved' ? 'Save a set to keep it here.' : 'Sets you play show up here.' }}
      </p>
      <ul v-else class="rows">
        <li v-for="s in rows" :key="s.id">
          <button type="button" class="row" :class="{ active: s.id === activeId }" @click="emit('play', s)">
            <img :src="`https://i.ytimg.com/vi/${s.id}/default.jpg`" alt="" loading="lazy" width="64" height="36">
            <span class="text">
              <strong>{{ s.title }}</strong>
              <span>{{ subtitle(s) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </aside>
  </Transition>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgb(0 0 0 / 0.55);
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 21;
  width: min(380px, 100vw);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background: var(--panel);
  box-shadow: -12px 0 32px rgb(0 0 0 / 0.5);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin: 0;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.close {
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

.tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.tabs button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: none;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.tabs button[aria-selected='true'] {
  border-color: var(--border-strong);
  background: var(--surface);
  color: var(--text);
}

.badge {
  padding: 0 6px;
  border-radius: 3px;
  background: var(--surface-2);
  font-size: 10px;
  color: var(--muted);
}

.badge.pink {
  background: var(--accent-2);
  color: var(--bg);
}

.empty {
  margin: 0;
  padding: 20px 16px;
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
  padding: 10px 16px;
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
  width: 64px;
  height: 36px;
  object-fit: cover;
  border: 1px solid var(--border);
}

.text {
  display: grid;
  min-width: 0;
}

.text > * {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text strong {
  font-size: 14px;
}

.text span {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
