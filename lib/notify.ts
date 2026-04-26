const BOT_TOKEN = process.env.BOT_TOKEN
const ADMIN_ID = process.env.GLAVNIY_ADMIN_ID || '8156792282'

export async function notifyAdminError(title: string, error: unknown, extra: Record<string, unknown> = {}) {
  if (!BOT_TOKEN || !ADMIN_ID) return

  const message = error instanceof Error ? error.message : String(error)
  const details = Object.entries(extra)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 200)}`)
    .join('\n')

  const text = [
    `⚠️ <b>${title}</b>`,
    message ? `<code>${escapeHtml(message).slice(0, 1200)}</code>` : '',
    details ? `<pre>${escapeHtml(details).slice(0, 1200)}</pre>` : '',
  ].filter(Boolean).join('\n\n')

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_ID, text, parse_mode: 'HTML' }),
    })
  } catch {
    // Error notification must never break the user-facing flow.
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
