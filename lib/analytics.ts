export function trackEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({ event, payload })

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics', blob)
    return
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
