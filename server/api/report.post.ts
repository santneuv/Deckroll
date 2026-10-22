const MAX_NOTE = 1000

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const set = findSet(bodyField(body, 'id'))
  const reason = bodyField(body, 'reason') as ReportReason
  const note = bodyField(body, 'note')

  // Honeypot: only bots fill the hidden "website" field; pretend it worked
  if (bodyField(body, 'website')) return { ok: true }

  if (!set) throw createError({ statusCode: 400, statusMessage: 'Unknown set' })
  if (!(reason in REPORT_REASONS)) throw createError({ statusCode: 400, statusMessage: 'Pick a reason' })
  if (note.length > MAX_NOTE) throw createError({ statusCode: 400, statusMessage: 'Note is too long' })

  const siteUrl = useRuntimeConfig(event).public.siteUrl
  await emailOwner(event, {
    subject: `Deckroll report: ${REPORT_REASONS[reason]} — ${set.title}`,
    text: [
      `Reason: ${REPORT_REASONS[reason]}`,
      `Set: ${set.title}`,
      `Artist: ${set.artist}`,
      `Video ID: ${set.id}`,
      `YouTube: https://www.youtube.com/watch?v=${set.id}`,
      `Deckroll: ${siteUrl}/?set=${set.id}`,
      ...(note ? ['', note] : []),
    ].join('\n'),
  })
  return { ok: true }
})
