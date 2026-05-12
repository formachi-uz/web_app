import { NextRequest, NextResponse } from 'next/server'
import pool, { createOrder } from '@/lib/db'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.BOT_TOKEN!
const GROUP_ORDERS = process.env.GROUP_CHAT_ID || process.env.GROUP_ORDERS_ID || '-5194049252'
const ADMIN_ID = process.env.GLAVNIY_ADMIN_ID || '8156792282'
const CARD_PAYMENT = "9860340101082121 - Xolbo'tayev Bobur"

function orderActionsKeyboard(orderId: number) {
  return {
    inline_keyboard: [[
      { text: 'Tasdiqlash', callback_data: `admin_confirm_${orderId}` },
      { text: 'Bekor qilish', callback_data: `admin_cancel_${orderId}` },
    ]],
  }
}

function canSendTelegramPhoto(photo?: string) {
  if (!photo) return false
  return !photo.startsWith('/')
}

async function sendTelegramMessage(chatId: string, text: string, orderId: number, photo?: string): Promise<boolean> {
  if (!BOT_TOKEN) return false
  const base = `https://api.telegram.org/bot${BOT_TOKEN}`
  const reply_markup = orderActionsKeyboard(orderId)

  try {
    if (photo && canSendTelegramPhoto(photo)) {
      const caption = text.length > 1024 ? text.slice(0, 1020) + '...' : text
      const res = await fetch(`${base}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup }),
      })
      if (res.ok) return true
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

async function sendTelegramText(chatId: string | number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false
  const base = `https://api.telegram.org/bot${BOT_TOKEN}`
  try {
    const res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    return res.ok
  } catch {
    return false
  }
}

function chatCandidates(raw: string): string[] {
  const set = new Set<string>()
  for (const value of raw.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean)) {
    set.add(value)
    if (/^\d+$/.test(value)) {
      set.add(`-${value}`)
      set.add(`-100${value}`)
    }
    if (/^-\d+$/.test(value) && !value.startsWith('-100')) {
      set.add(`-100${value.slice(1)}`)
    }
  }
  return [...set]
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

async function findTelegramIdByPhone(phone: string): Promise<number | undefined> {
  const normalized = normalizePhone(phone)
  if (!normalized) return undefined
  const tail = normalized.slice(-9)

  for (const column of ['phone', 'phone_number']) {
    try {
      const { rows } = await pool.query(
        `SELECT telegram_id
         FROM users
         WHERE telegram_id > 0
           AND (regexp_replace(COALESCE(${column}, ''), '\\D', '', 'g') = $1
             OR right(regexp_replace(COALESCE(${column}, ''), '\\D', '', 'g'), 9) = $2)
         ORDER BY id DESC
         LIMIT 1`,
        [normalized, tail]
      )
      const value = Number(rows[0]?.telegram_id)
      if (value > 0) return value
    } catch {
      // Some deployments have only one of phone/phone_number columns.
    }
  }

  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, address, payment_type, items, total, telegram_id } = body

    if (!customer_name?.trim()) {
      return NextResponse.json({ error: 'Ism kiritilmagan' }, { status: 400 })
    }
    if (!customer_phone?.trim()) {
      return NextResponse.json({ error: 'Telefon raqami kiritilmagan' }, { status: 400 })
    }
    if (!address?.trim()) {
      return NextResponse.json({ error: 'Manzil kiritilmagan' }, { status: 400 })
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

    const customerTelegramId = Number(telegram_id) > 0
      ? Number(telegram_id)
      : await findTelegramIdByPhone(customer_phone.trim())

    const orderId = await createOrder({
      telegram_id: customerTelegramId,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      address: address.trim(),
      payment_type,
      items,
      total,
    })

    const paymentLabel = payment_type === 'card'
      ? `Paynet / karta: ${CARD_PAYMENT}`
      : 'Uzum Nasiya'
    const nasiyaNote = payment_type === 'credit' ? '\n<b>UZUM NASIYA - mijoz bilan boglaning.</b>' : ''

    let cartLines = ''
    let firstPhoto: string | undefined

    for (const item of items) {
      const extra = [
        item.size ? `Razmeri: ${item.size}` : '',
        item.back_print ? `Yozilishi: ${item.back_print}` : '',
      ].filter(Boolean).join(' | ')

      cartLines += `- ${item.name}${extra ? ' | ' + extra : ''} x ${item.qty} = ${(item.price * item.qty).toLocaleString()} so'm\n`
      if (!firstPhoto && item.photo_url) firstPhoto = item.photo_url
    }

    const adminText =
      `<b>SAYTDAN BUYURTMA #${orderId}</b>${nasiyaNote}\n` +
      `${'-'.repeat(28)}\n` +
      `Ism: ${customer_name.trim()}\n` +
      `Tel: ${customer_phone.trim()}\n` +
      `Dastavka: ${address.trim()}\n` +
      `Tolov: ${paymentLabel}\n` +
      `${'-'.repeat(28)}\n` +
      cartLines +
      `${'-'.repeat(28)}\n` +
      `<b>JAMI: ${Number(total).toLocaleString()} so'm</b>`

    const customerText =
      `<b>✅ Buyurtmangiz qabul qilindi!</b>\n` +
      `${'-'.repeat(24)}\n` +
      `Buyurtma: <b>#${orderId}</b>\n` +
      `Jami: <b>${Number(total).toLocaleString()} so'm</b>\n` +
      `To'lov: ${paymentLabel}\n\n` +
      `Admin buyurtmangizni ko'rib chiqadi va tez orada aloqaga chiqadi.\n` +
      `📦 Mahsulot qo'lingizga yetgach <b>Buyurtmalarim</b> bo'limidan <b>Mahsulotni oldim</b> tugmasini bosishni unutmang.`

    const candidates = chatCandidates(GROUP_ORDERS)
    let groupOk = false
    for (const chatId of candidates) {
      const ok = await sendTelegramMessage(chatId, adminText, orderId, firstPhoto)
      if (ok) {
        groupOk = true
        break
      }
    }

    if (!groupOk) {
      await notifyAdminError('Order group notify failed', new Error('All chat candidates failed'), {
        GROUP_ORDERS,
        order_id: orderId,
      })
    }

    let adminOk = false
    if (ADMIN_ID) {
      adminOk = await sendTelegramMessage(ADMIN_ID, adminText, orderId, firstPhoto)
    }

    let customerOk = false
    if (customerTelegramId) {
      customerOk = await sendTelegramText(customerTelegramId, customerText)
      if (!customerOk) {
        await notifyAdminError('Order customer notify failed', new Error('Customer Telegram message failed'), {
          order_id: orderId,
          telegram_id: customerTelegramId,
        })
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      group_notified: groupOk,
      admin_notified: adminOk,
      customer_notified: customerOk,
    })
  } catch (error) {
    console.error('Orders API error:', error)
    await notifyAdminError('Orders API error', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
