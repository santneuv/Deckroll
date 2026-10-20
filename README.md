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
| `minDurationMin`, `minViews` | Minimum length and view count for a set |

Put a YouTube Data API v3 key in `.env` (see `.env.example`), then:

```bash
pnpm ingest
```

A full run costs about 2,000 of the 10,000 daily quota units. Place fields (`city`, `country`, `venue`, `coords`, `setting`) of sets that are already in `data/sets.json` are kept; new sets arrive with `enrichedAt: null` and empty place fields.

## API

| Route | Returns |
|---|---|
| `GET /api/spin` | One random set matching the filters (`genre`, `city`, `broadcaster`, `setting`, repeatable), skipping `exclude` ids |
| `GET /api/count` | How many sets match the filters |
| `GET /api/facets` | Filter options with counts |
| `GET /api/sets/:id` | One set |
