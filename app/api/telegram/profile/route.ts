import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

type TelegramUser = {
  id?: number
  first_name?: string
  last_name?: string
  username?: string
}

function validateTelegramInitData(initData: string): TelegramUser | null {
  const botToken = process.env.BOT_TOKEN
  if (!botToken || !initData) return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const calculated = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const left = Buffer.from(calculated, 'hex')
  const right = Buffer.from(hash, 'hex')
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null

  const userJson = params.get('user')
  if (!userJson) return null

  try {
    return JSON.parse(userJson) as TelegramUser
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()
    const telegramUser = validateTelegramInitData(String(initData || ''))

    if (!telegramUser?.id) {
      return NextResponse.json({ registered: false, error: 'Telegram maʼlumoti tasdiqlanmadi' }, { status: 401 })
    }

    const fallbackName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim()

    try {
      const { rows } = await pool.query(
        `SELECT telegram_id, full_name, username, phone
         FROM users
         WHERE telegram_id = $1
         LIMIT 1`,
        [telegramUser.id]
      )

      const profile = rows[0]
      return NextResponse.json({
        registered: Boolean(profile?.phone),
        telegram_id: telegramUser.id,
        full_name: profile?.full_name || fallbackName,
        username: profile?.username || telegramUser.username || '',
        phone: profile?.phone || '',
      })
    } catch {
      return NextResponse.json({
        registered: false,
        telegram_id: telegramUser.id,
        full_name: fallbackName,
        username: telegramUser.username || '',
        phone: '',
      })
    }
  } catch {
    return NextResponse.json({ registered: false, error: 'Server xatosi' }, { status: 500 })
  }
}
