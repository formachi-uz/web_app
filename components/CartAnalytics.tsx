'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart'
import { trackEvent } from '@/lib/analytics'

export default function CartAnalytics() {
  const items = useCart((state) => state.items)
  const total = useCart((state) => state.total)
  const sentForCount = useRef(0)

  useEffect(() => {
    if (items.length === 0) {
      sentForCount.current = 0
      return
    }

    const count = items.reduce((sum, item) => sum + item.qty, 0)
    const timer = window.setTimeout(() => {
      if (window.location.pathname.startsWith('/checkout')) return
      if (sentForCount.current === count) return
      sentForCount.current = count
      trackEvent('abandoned_cart_signal', {
        items_count: items.length,
        quantity: count,
        total: total(),
      })
    }, 45000)

    return () => window.clearTimeout(timer)
  }, [items, total])

  return null
}
