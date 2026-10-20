<script setup lang="ts">
const props = withDefaults(defineProps<{
  options: FacetCount[]
  limit?: number
  search?: string
  format?: (name: string) => string
}>(), { limit: Number.POSITIVE_INFINITY, search: '' })

const selected = defineModel<string[]>({ required: true })
const expanded = ref(false)

const filtered = computed(() => {
  const q = props.search.trim().toLowerCase()
  return q ? props.options.filter(o => o.name.toLowerCase().includes(q)) : props.options
})

const visible = computed(() => {
  if (expanded.value || props.search.trim()) return filtered.value
  const top = filtered.value.slice(0, props.limit)
  const selectedBeyondLimit = filtered.value.filter(o => selected.value.includes(o.name) && !top.includes(o))
  return [...top, ...selectedBeyondLimit]
})

function toggle(name: string) {
  selected.value = selected.value.includes(name)
    ? selected.value.filter(n => n !== name)
    : [...selected.value, name]
}
</script>

<template>
  <div class="chips">
    <button
      v-for="o in visible"
      :key="o.name"
      type="button"
      class="chip"
      :class="{ on: selected.includes(o.name) }"
      :aria-pressed="selected.includes(o.name)"
      @click="toggle(o.name)"
    >
      {{ format ? format(o.name) : o.name }}
      <span class="count">{{ o.count }}</span>
    </button>
    <button
      v-if="visible.length < filtered.length"
      type="button"
      class="chip more"
      @click="expanded = true"
    >
      + Show all ({{ filtered.length }})
    </button>
    <button
      v-else-if="expanded && filtered.length > limit"
      type="button"
      class="chip more"
      @click="expanded = false"
    >
      − Show less
    </button>
    <p v-if="filtered.length === 0" class="empty">No match</p>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.more {
  border-style: dashed;
  color: var(--accent);
}

.empty {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}
</style>
