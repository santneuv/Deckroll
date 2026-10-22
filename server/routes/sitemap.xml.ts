export default defineEventHandler((event) => {
  const origin = useRuntimeConfig(event).public.siteUrl
  const paths = ['/', '/map', ...getArtistSlugs().map(slug => `/artist/${slug}`)]
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(path => `  <url><loc>${origin}${path}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')
})
