export default defineEventHandler((event) => {
  const query = parseSetQuery(event)
  const matches = filterSets(query)
  const notRecentlyPlayed = matches.filter(s => !query.exclude.has(s.id))
  const pool = notRecentlyPlayed.length > 0 ? notRecentlyPlayed : matches
  const set = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]! : null

  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { set, matches: matches.length }
})
