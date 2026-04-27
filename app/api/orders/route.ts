import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/db'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const BOT_TOKEN      = process.env.BOT_TOKEN!
const GROUP_ORDERS   = process.env.GROUP_CHAT_ID    || process.env.GROUP_ORDERS_ID || '-5194049252'
const ADMIN_ID       = process.env.GLAVNIY_ADMIN_ID || '8156792282'

// ─── Telegram helpers ─────────────────────────────────────────────────────────

function orderActionsKeyboard(orderId: number) {
  return {
    inline_keyboard: [[
      { text: '✅ Tasdiqlash',    callback_data: `admin_confirm_${orderId}` },
      { text: '❌ Bekor qilish', callback_data: `admin_cancel_${orderId}` },
    ]],
  }
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  orderId: number,
  photo?: string
): Promise<boolean> {
  if (!BOT_TOKEN) return false
  const base = `https://api.telegram.org/bot${BOT_TOKEN}`
  const reply_markup = orderActionsKeyboard(orderId)

  try {
    if (photo) {
      const caption = text.length > 1024 ? text.slice(0, 1020) + '…' : text
      const res = await fetch(`${base}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup }),
      })
      return res.ok
    }
    const res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup }),
    })
    return res.ok
  } catch {
    return false
  }
}

// GROUP_CHAT_ID ni formatlar: "-5194049252", "5194049252", "100..." hammasini sinash
function chatCandidates(raw: string): string[] {
  const set = new Set<string>()
  for (const v of raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)) {
    set.add(v)
    if (/^\d+$/.test(v)) {
      set.add(`-${v}`)
      set.add(`-100${v}`)
    }
    if (/^-\d+$/.test(v) && !v.startsWith('-100')) {
      set.add(`-100${v.slice(1)}`)
    }
  }
  return [...set]
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, address, payment_type, items, total } = body

    // Validation
    if (!customer_name?.trim()) {
      return NextResponse.json({ error: "Ism kiritilmagan" }, { status: 400 })
    }
    if (!customer_phone?.trim()) {
      return NextResponse.json({ error: "Telefon raqami kiritilmagan" }, { status: 400 })
    }
    if (!address?.trim()) {
      return NextResponse.json({ error: "Manzil kiritilmagan" }, { status: 400 })
    }
    if (!['card', 'credit'].includes(payment_type)) {
      return NextResponse.json({ error: "To'lov turi noto'g'ri" }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Savat bo'sh" }, { status: 400 })
    }
    for (const item of items) {
      if (!item.product_id || item.qty <= 0 || item.price < 0) {
        return NextResponse.json({ error: "Savat ma'lumotlari noto'g'ri" }, { status: 400 })
      }
    }

    // DB: order yaratish
    const orderId = await createOrder({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      address: address.trim(),
      payment_type,
      items,
      total,
    })

    // Telegram xabari matni
    const paymentLabel = payment_type === 'card' ? '💳 Karta / Paynet' : '🤝 Uzum Nasiya'
    const nasiyaNote   = payment_type === 'credit' ? '\n⚠️ <b>UZUM NASIYA — aloqaga chiqing!</b>' : ''

    let cartLines = ''
    let firstPhoto: string | undefined

    for (const item of items) {
      const extra = [
        item.size       ? `(${item.size})`       : '',
        item.back_print ? `✍️ ${item.back_print}` : '',
      ].filter(Boolean).join(' | ')

      cartLines += `• ${item.name}${extra ? ' ' + extra : ''} × ${item.qty} = ${(item.price * item.qty).toLocaleString()} so'm\n`
      if (!firstPhoto && item.photo_url) firstPhoto = item.photo_url
    }

    const adminText =
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

    // Guruhga yuborish
    const candidates = chatCandidates(GROUP_ORDERS)
    let groupOk = false
    for (const chatId of candidates) {
      const ok = await sendTelegramMessage(chatId, adminText, orderId, firstPhoto)
      if (ok) { groupOk = true; break }
    }

    if (!groupOk) {
      await notifyAdminError('Order group notify failed', new Error('All chat candidates failed'), {
        GROUP_ORDERS, order_id: orderId,
      })
    }

    // Glavniy adminga ham yuborish
    let adminOk = false
    if (ADMIN_ID) {
      adminOk = await sendTelegramMessage(ADMIN_ID, adminText, orderId, firstPhoto)
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      group_notified: groupOk,
      admin_notified: adminOk,
    })
  } catch (error) {
    console.error('Orders API error:', error)
    await notifyAdminError('Orders API error', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
