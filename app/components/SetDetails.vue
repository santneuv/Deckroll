<script setup lang="ts">
const props = defineProps<{ set: DjSet, saved: boolean, filters: SetFilters, startAt: number }>()
defineEmits<{ toggleSave: [], openInfo: [], restart: [], toggleFilter: [key: 'genres' | 'settings', value: string] }>()

const place = computed(() => [props.set.city, props.set.country].filter(Boolean).join(', '))
</script>

<template>
  <section class="details">
    <h1 class="title" :title="set.title">{{ set.title }}</h1>

    <div class="row">
      <dl class="meta">
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
          <dt class="label">Source</dt>
          <dd class="accent">{{ set.broadcaster }}</dd>
        </div>
        <div v-if="set.venue || place">
          <dt class="label">Location</dt>
          <dd>
            <template v-if="set.venue">{{ set.venue }}</template>
            <span v-if="set.venue && place" class="sep">·</span>
            <span v-if="place" class="place">{{ place }}</span>
          </dd>
        </div>
        <div>
          <dt class="label">Runtime</dt>
          <dd>{{ formatDuration(set.durationSec) }}</dd>
        </div>
      </dl>

      <ul class="tags">
        <li>
          <button
            type="button"
            class="chip"
            :class="{ on: filters.settings.includes(set.setting) }"
            :aria-pressed="filters.settings.includes(set.setting)"
            :title="`Filter by ${SETTING_LABELS[set.setting]}`"
            @click="$emit('toggleFilter', 'settings', set.setting)"
          >
            {{ SETTING_LABELS[set.setting] }}
          </button>
        </li>
        <li v-for="g in set.genres" :key="g">
          <button
            type="button"
            class="chip"
            :class="{ on: filters.genres.includes(g) }"
            :aria-pressed="filters.genres.includes(g)"
            :title="`Filter by ${g}`"
            @click="$emit('toggleFilter', 'genres', g)"
          >
            {{ g }}
          </button>
        </li>
      </ul>

      <div class="actions">
        <button
          v-if="startAt > 0"
          type="button"
          class="btn dropped"
          :title="`Dropped in at ${formatDuration(startAt)}. Play from the beginning`"
          @click="$emit('restart')"
        >
          ↺ From start
        </button>
        <button type="button" class="btn" :class="{ on: saved }" :aria-pressed="saved" @click="$emit('toggleSave')">
          {{ saved ? '✓ Saved' : 'Save' }}
        </button>
        <button type="button" class="btn" @click="$emit('openInfo')">Set details</button>
        <a class="btn" :href="`https://www.youtube.com/watch?v=${set.id}`" target="_blank" rel="noopener">
          Open on YouTube ↗
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.details {
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.title {
  margin: 0;
  font-size: clamp(1.1rem, 1.8vw, 1.45rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px 24px;
  flex-wrap: wrap;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
  margin: 0;
}

.meta > div {
  padding: 0 16px;
  border-left: 1px solid var(--border);
}

.meta > div:first-child {
  padding-left: 0;
  border-left: 0;
}

.meta dd {
  margin: 2px 0 0;
  font-family: var(--mono);
  font-size: 13px;
  white-space: nowrap;
}

.accent {
  color: var(--accent);
}

.place {
  text-decoration: underline;
  text-decoration-color: var(--accent-2);
  text-underline-offset: 4px;
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

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.dropped {
  border-color: var(--accent-2);
  color: var(--accent-2);
  background: var(--accent-2-soft);
}

@media (max-width: 560px) {
  .meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
  }

  .meta > div {
    padding: 0;
    border-left: 0;
  }

  .meta dd {
    white-space: normal;
  }

  .actions {
    margin-left: 0;
  }
}
</style>
