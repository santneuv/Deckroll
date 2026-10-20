const LIMIT = 12

export default defineEventHandler((event) => {
  const { artist, exclude } = getQuery(event)
  if (typeof artist !== 'string' || artist.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'artist is required' })
  }
  return { sets: setsByArtists(artist, typeof exclude === 'string' ? exclude : '', LIMIT) }
})
