const LIMIT = 60

export default defineEventHandler((event) => {
  const matches = filterSets(parseSetQuery(event)).sort((a, b) => b.views - a.views)
  return { total: matches.length, sets: matches.slice(0, LIMIT) }
})
