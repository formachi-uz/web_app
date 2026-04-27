import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const allowedEvents = new Set([
  'product_view',
  'product_click',
  'add_to_cart',
  'buy_now',
  'checkout_step',
  'order_submitted',
  'check_uploaded',
  'checkout_error',
  'begin_checkout',
  'abandoned_cart_signal',
  'product_search',
])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = String(body.event || '')
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}

    if (!allowedEvents.has(event)) {
      return NextResponse.json({ error: 'Event noto‘g‘ri' }, { status: 400 })
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGSERIAL PRIMARY KEY,
        event TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        path TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await pool.query(
      `INSERT INTO analytics_events (event, payload, path, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [
        event,
        JSON.stringify(payload),
        req.headers.get('referer'),
        req.headers.get('user-agent'),
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    await notifyAdminError('Analytics API error', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
