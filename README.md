# Deckroll

Roll for a random full-length DJ set. Filter by genre, venue, source and city, or **Drop in** to start a set mid-way, on a track change when the set has a tracklist.

Built with Nuxt 4. The set catalogue is a JSON file (`data/sets.json`) collected from YouTube with the Data API.

## Setup

Requires Node 24.15+ and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Updating the catalogue

`data/sources.json` controls what gets collected:

| Field | Meaning |
|---|---|
| `artists` | Artist names to search for, with the genres assigned to their sets |
| `channels` | YouTube channels to scan in full for those artists |
| `blockedChannels` | Channels whose uploads are always skipped (fan / AI mixes) |
| `excludedVideos` | Individual videos that are always skipped |
| `pinnedVideos` | Videos always kept while playable, even when shorter or less viewed than the limits |
| `artists[].search` | `false` skips the YouTube search for that artist |
| `minDurationMin`, `minViews` | Minimum length and view count for a set |

Put a YouTube Data API v3 key in `.env` (see `.env.example`), then:

```bash
pnpm ingest
```

A full run costs about 2,000 of the 10,000 daily quota units. Place fields (`city`, `country`, `venue`, `coords`, `setting`) of sets that are already in `data/sets.json` are kept; new sets arrive with `enrichedAt: null` and empty place fields.

## Contact form

The header's **Contact** button opens a form that posts to `POST /api/contact` (`name`, `email`, `message`), which emails the message through [Resend](https://resend.com) with the sender's address as reply-to. Set `NUXT_RESEND_API_KEY` and `NUXT_CONTACT_TO` in `.env` and in the hosting environment; until both are set the form answers 503. `NUXT_CONTACT_FROM` defaults to `onboarding@resend.dev`, which only delivers to the Resend account's own address; verify a domain in Resend to send from it.

## API

| Route | Returns |
|---|---|
| `GET /api/spin` | One random set matching the filters (`genre`, `city`, `broadcaster`, `setting`, repeatable), skipping `exclude` ids |
| `GET /api/count` | How many sets match the filters |
| `GET /api/facets` | Filter options with counts |
| `GET /api/sets/:id` | One set |
| `GET /api/artist-sets` | Up to 12 other sets by the same artist(s) (`artist`, `exclude`), most viewed first |

## Map

`/map` shows every city that has sets with known coordinates. Country outlines are drawn from [Natural Earth](https://www.naturalearthdata.com/) (public domain, `public/map/countries.json`), so the map needs no tile provider or API key.

| Route | Returns |
|---|---|
| `GET /api/cities` | Cities with coordinates and set counts |
| `GET /api/sets` | Up to 60 sets matching the filters, most viewed first |

## Sharing

`/?set=<id>` opens a set and `&t=<seconds>` starts it at that point (Drop In writes both into the address bar). Set links render Open Graph tags with the video thumbnail, so they preview in chat apps and social media.
