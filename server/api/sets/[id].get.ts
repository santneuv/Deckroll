export default defineEventHandler((event) => {
  const set = findSet(getRouterParam(event, 'id') ?? '')
  if (!set) throw createError({ statusCode: 404, statusMessage: 'Set not found' })
  return set
})
