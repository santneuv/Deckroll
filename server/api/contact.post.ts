const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME = 100
const MAX_MESSAGE = 5000

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const field = (key: string) => (typeof body?.[key] === 'string' ? (body[key] as string).trim() : '')
  const name = field('name')
  const email = field('email')
  const message = field('message')

  // Honeypot: only bots fill the hidden "website" field; pretend it worked
  if (field('website')) return { ok: true }

  if (!EMAIL.test(email)) throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  if (!message) throw createError({ statusCode: 400, statusMessage: 'Message is required' })
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    throw createError({ statusCode: 400, statusMessage: 'Message is too long' })
  }

  const { resendApiKey, contactTo, contactFrom } = useRuntimeConfig(event)
  if (!resendApiKey || !contactTo) {
    throw createError({ statusCode: 503, statusMessage: 'Contact form is not configured' })
  }

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}` },
      body: {
        from: contactFrom,
        to: contactTo,
        reply_to: email,
        subject: `Deckroll contact: ${name || email}`,
        text: `From: ${name ? `${name} <${email}>` : email}\n\n${message}`,
      },
    })
  }
  catch (err) {
    console.error('Contact email failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Could not send the message' })
  }
  return { ok: true }
})
