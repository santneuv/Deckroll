export default defineEventHandler((event) => {
  const artist = findArtist(getRouterParam(event, 'slug') ?? '')
  if (!artist) throw createError({ statusCode: 404, statusMessage: 'Artist not found' })
  return artist
})
