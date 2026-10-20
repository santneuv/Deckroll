<script setup lang="ts">
defineProps<{ total?: number }>()
</script>

<template>
  <header class="topbar">
    <NuxtLink to="/" class="brand" aria-label="Deckroll home">
      <AppLogo :size="30" />
      <span class="name">Deck<span class="roll">roll</span></span>
      <span v-if="total" class="total">{{ total }} sets</span>
    </NuxtLink>
    <nav class="tabs" aria-label="Main">
      <NuxtLink to="/" class="tab" exact-active-class="active">Roulette</NuxtLink>
      <NuxtLink to="/map" class="tab" active-class="active">Map</NuxtLink>
    </nav>
    <div class="actions">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  height: var(--header-h);
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.name {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.roll {
  color: var(--accent);
}

.total {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
}

.tabs {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.tab {
  padding: 7px 14px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
}

.tab + .tab {
  border-left: 1px solid var(--border);
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--accent-2);
  background: var(--accent-2-soft);
  box-shadow: inset 0 0 0 1px var(--accent-2);
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 900px) {
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    gap: 10px;
    padding: 0 12px;
  }

  .total {
    display: none;
  }

  .name {
    display: none;
  }

  .tab {
    padding: 7px 10px;
  }
}
</style>
