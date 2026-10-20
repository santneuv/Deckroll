// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vercel/analytics'],
  runtimeConfig: {
    public: {
      siteUrl: 'https://deckroll.xyz',
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Deckroll — random DJ sets',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Deckroll: roll for a random full-length DJ set. Filter by genre, city, source and venue.' },
        { name: 'theme-color', content: '#0a0a0c' },
        { property: 'og:site_name', content: 'Deckroll' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap' },
      ],
    },
  },
})
