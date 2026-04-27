import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/db'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.BOT_TOKEN!
const GROUP_ORDERS_ID = process.env.GROUP_CHAT_ID || process.env.GROUP_ORDERS_ID || '-5194049252'
const GLAVNIY_ADMIN = process.env.GLAVNIY_ADMIN_ID || '8156792282'

function orderActionsKeyboard(orderId: number) {
  return {
    inline_keyboard: [[
      { text: '✅ Tasdiqlash', callback_data: `admin_confirm_${orderId}` },
      { text: '❌ Bekor qilish', callback_data: `admin_cancel_${orderId}` },
    ]],
  }
}

function chatCandidates(rawChatId: string) {
  const candidates: string[] = []

  for (const rawValue of rawChatId.split(/[,\s]+/)) {
    const value = rawValue.trim()
    if (!value) continue

    candidates.push(value)

    if (/^\d+$/.test(value)) {
      candidates.push(`-${value}`)
      candidates.push(`-100${value}`)
    }

    if (/^-\d+$/.test(value) && !value.startsWith('-100')) {
      candidates.push(`-100${value.slice(1)}`)
    }
  }

  return [...new Set(candidates)]
}

async function sendTelegram(chatId: string, text: string, orderId: number, photo?: string) {
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN topilmadi')
  }

  const base = `https://api.telegram.org/bot${BOT_TOKEN}`
  const reply_markup = orderActionsKeyboard(orderId)

  if (photo) {
    const caption = text.length > 1024 ? text.slice(0, 1020) + '...' : text
    const res = await fetch(`${base}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup }),
    })
    if (!res.ok) throw new Error(`${chatId}: Telegram sendPhoto error: ${await res.text()}`)
    return
  }

  const res = await fetch(`${base}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup }),
  })
  if (!res.ok) throw new Error(`${chatId}: Telegram sendMessage error: ${await res.text()}`)
}

async function sendToFirstWorkingChat(chatIds: string[], text: string, orderId: number, photo?: string) {
  const errors: string[] = []

  for (const chatId of chatIds) {
    try {
      await sendTelegram(chatId, text, orderId, photo)
      return { ok: true, chatId, errors }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  return { ok: false, chatId: null, errors }
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
    const nasiyaNote = payment_type === 'credit' ? '\n⚠️ <b>UZUM NASIYA — aloqaga chiqing!</b>' : ''

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

    const orderChatResult = await sendToFirstWorkingChat(
      chatCandidates(GROUP_ORDERS_ID),
      adminText,
      orderId,
      firstPhoto
    )

    if (!orderChatResult.ok) {
      await notifyAdminError('Order group notify failed', new Error(orderChatResult.errors.join('\n')), {
        GROUP_CHAT_ID: GROUP_ORDERS_ID,
        order_id: orderId,
      })
    }

    let adminNotified = false
    if (GLAVNIY_ADMIN && GLAVNIY_ADMIN !== orderChatResult.chatId) {
      try {
        await sendTelegram(GLAVNIY_ADMIN, adminText, orderId, firstPhoto)
        adminNotified = true
      } catch (error) {
        console.error('Telegram admin notify error:', error)
        await notifyAdminError('Order admin notify failed', error, { order_id: orderId })
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      order_group_notified: orderChatResult.ok,
      order_group_chat_id: orderChatResult.chatId,
      admin_notified: adminNotified,
    })
  } catch (error) {
    console.error('Orders API error:', error)
    await notifyAdminError('Orders API error', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
