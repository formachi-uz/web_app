import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/db'

export const dynamic = 'force-dynamic'

const BOT_TOKEN       = process.env.BOT_TOKEN!
const GROUP_ORDERS_ID = process.env.GROUP_CHAT_ID    || '-5194049252'
const GLAVNIY_ADMIN   = process.env.GLAVNIY_ADMIN_ID || '8156792282'

function orderActionsKeyboard(orderId: number) {
  return {
    inline_keyboard: [[
      { text: '✅ Tasdiqlash', callback_data: `admin_confirm_${orderId}` },
      { text: '❌ Bekor qilish', callback_data: `admin_cancel_${orderId}` },
    ]],
  }
}

async function sendTelegram(chat_id: string, text: string, orderId: number, photo?: string) {
  if (!BOT_TOKEN) {
    console.warn('BOT_TOKEN topilmadi: buyurtma Telegram guruhiga yuborilmadi')
    return
  }

  const base = `https://api.telegram.org/bot${BOT_TOKEN}`
  const reply_markup = orderActionsKeyboard(orderId)

  if (photo) {
    const caption = text.length > 1024 ? text.slice(0, 1020) + '...' : text
    const res = await fetch(`${base}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, photo, caption, parse_mode: 'HTML', reply_markup }),
    })
    if (!res.ok) throw new Error(`Telegram sendPhoto error: ${await res.text()}`)
  } else {
    const res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', reply_markup }),
    })
    if (!res.ok) throw new Error(`Telegram sendMessage error: ${await res.text()}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customer_name,
      customer_phone,
      address,
      payment_type,
      items,
      total,
    } = body

    if (!customer_name || !customer_phone || !address || !payment_type || !items?.length) {
      return NextResponse.json({ error: "Ma'lumotlar to'liq emas" }, { status: 400 })
    }
    if (!items.every((item: any) => item.product_id && item.qty > 0 && item.price >= 0)) {
      return NextResponse.json({ error: "Savat ma'lumotlari noto'g'ri" }, { status: 400 })
    }

    const orderId = await createOrder({
      telegram_id: 0,
      customer_name,
      customer_phone,
      address,
      payment_type,
      items,
      total,
    })

    const paymentLabel = payment_type === 'card' ? '💳 Karta / Paynet' : '🤝 Uzum Nasiya'
    const nasiyaNote   = payment_type === 'credit' ? '\n⚠️ <b>UZUM NASIYA — aloqaga chiqing!</b>' : ''

    let cartLines = ''
    let firstPhoto: string | undefined

    for (const item of items) {
      const extra = [
        item.size ? `(${item.size})` : '',
        item.back_print ? `✍️ ${item.back_print}` : '',
      ].filter(Boolean).join(' | ')
      cartLines += `• ${item.name}${extra ? ' ' + extra : ''} × ${item.qty} = ${(item.price * item.qty).toLocaleString()} so'm\n`
      if (!firstPhoto && item.photo_url) firstPhoto = item.photo_url
    }

    const adminText = (
      `🌐 <b>SAYTDAN BUYURTMA #${orderId}</b>${nasiyaNote}\n` +
      `${'─'.repeat(28)}\n` +
      `👤 ${customer_name}\n` +
      `📱 ${customer_phone}\n` +
      `${'─'.repeat(28)}\n` +
      `📍 ${address}\n` +
      `💳 ${paymentLabel}\n` +
      `${'─'.repeat(28)}\n` +
      cartLines +
      `${'─'.repeat(28)}\n` +
      `💰 <b>JAMI: ${total.toLocaleString()} so'm</b>`
    )

    const targets = [...new Set([GROUP_ORDERS_ID, GLAVNIY_ADMIN])]
    const telegramResults = await Promise.allSettled(
      targets.map((id) => sendTelegram(id, adminText, orderId, firstPhoto))
    )
    telegramResults.forEach((result) => {
      if (result.status === 'rejected') console.error('Telegram order notify error:', result.reason)
    })

    return NextResponse.json({ success: true, order_id: orderId })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
