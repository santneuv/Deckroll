const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME = 100
const MAX_MESSAGE = 5000

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const name = bodyField(body, 'name')
  const email = bodyField(body, 'email')
  const message = bodyField(body, 'message')

  // Honeypot: only bots fill the hidden "website" field; pretend it worked
  if (bodyField(body, 'website')) return { ok: true }

  if (!EMAIL.test(email)) throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  if (!message) throw createError({ statusCode: 400, statusMessage: 'Message is required' })
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    throw createError({ statusCode: 400, statusMessage: 'Message is too long' })
  }

  await emailOwner(event, {
    subject: `Deckroll contact: ${name || email}`,
    text: `From: ${name ? `${name} <${email}>` : email}\n\n${message}`,
    replyTo: email,
  })
  return { ok: true }
})
