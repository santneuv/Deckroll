export function useStoredSets(storageKey: string, max: number) {
  const items = ref<DjSet[]>([])

  onMounted(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) items.value = JSON.parse(raw)
    }
    catch {
      items.value = []
    }
  })

  watch(items, (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    }
    catch {
      // Private mode or full storage: the list just won't survive a reload.
    }
  })

  function add(set: DjSet) {
    items.value = [set, ...items.value.filter(s => s.id !== set.id)].slice(0, max)
  }

  function remove(id: string) {
    items.value = items.value.filter(s => s.id !== id)
  }

  function has(id: string) {
    return items.value.some(s => s.id === id)
  }

  return { items, add, remove, has }
}
