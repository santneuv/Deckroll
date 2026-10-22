import type { H3Event } from 'h3'

/** Emails the site owner (NUXT_CONTACT_TO) through Resend */
export async function emailOwner(event: H3Event, mail: { subject: string, text: string, replyTo?: string }) {
  const { resendApiKey, contactTo, contactFrom } = useRuntimeConfig(event)
  if (!resendApiKey || !contactTo) {
    throw createError({ statusCode: 503, statusMessage: 'Email is not configured' })
  }

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}` },
      body: {
        from: contactFrom,
        to: contactTo,
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo && { reply_to: mail.replyTo }),
      },
    })
  }
  catch (err) {
    console.error('Email failed:', err)
    throw createError({ statusCode: 502, statusMessage: 'Could not send the message' })
  }
}

/** Trimmed string field of a JSON body, '' when missing */
export function bodyField(body: Record<string, unknown> | undefined, key: string): string {
  const value = body?.[key]
  return typeof value === 'string' ? value.trim() : ''
}
