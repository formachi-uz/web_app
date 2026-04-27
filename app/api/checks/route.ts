import { NextRequest, NextResponse } from 'next/server'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.BOT_TOKEN!
const GROUP_CHECKS_ID = process.env.GROUP_CHECKS_ID || '-1003912030329'
const ADMIN_ID = process.env.GLAVNIY_ADMIN_ID || '8156792282'

function checkActionsKeyboard(orderId: string) {
  return {
    inline_keyboard: [[
      { text: '✅ Chekni tasdiqlash', callback_data: `check_confirm_${orderId}` },
      { text: '❌ Rad etish', callback_data: `check_reject_${orderId}` },
    ]],
  }
}

function buildTelegramForm(chatId: string, orderId: string, caption: string, file: File) {
  const telegramForm = new FormData()
  telegramForm.append('chat_id', chatId)
  telegramForm.append('caption', caption)
  telegramForm.append('parse_mode', 'HTML')
  telegramForm.append('reply_markup', JSON.stringify(checkActionsKeyboard(orderId)))
  telegramForm.append(file.type.startsWith('image/') ? 'photo' : 'document', file, file.name || 'check')
  return telegramForm
}

async function sendCheck(chatId: string, orderId: string, caption: string, file: File) {
  const method = file.type.startsWith('image/') ? 'sendPhoto' : 'sendDocument'
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    body: buildTelegramForm(chatId, orderId, caption, file),
  })
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      console.error('BOT_TOKEN topilmadi: chek Telegram kanaliga yuborilmadi')
      return NextResponse.json({ error: 'Telegram sozlamasi topilmadi' }, { status: 500 })
    }

    const formData = await req.formData()
    const orderId = String(formData.get('order_id') || '')
    const customerName = String(formData.get('customer_name') || '')
    const customerPhone = String(formData.get('customer_phone') || '')
    const file = formData.get('check') as File | null

    if (!orderId || !file) {
      return NextResponse.json({ error: 'Chek fayli topilmadi' }, { status: 400 })
    }

    const caption =
      `💳 <b>YANGI CHEK — Buyurtma #${orderId}</b>\n` +
      `${'─'.repeat(24)}\n` +
      `👤 ${customerName || 'Sayt mijozi'}\n` +
      `📱 ${customerPhone || '—'}`

    const res = await sendCheck(GROUP_CHECKS_ID, orderId, caption, file)
    if (res.ok) {
      return NextResponse.json({ success: true })
    }

    const errorText = await res.text()
    const canFallbackToAdmin = ADMIN_ID && ADMIN_ID !== GROUP_CHECKS_ID

    if (errorText.toLowerCase().includes('chat not found') && canFallbackToAdmin) {
      await notifyAdminError('Checks chat not found', new Error(errorText), {
        GROUP_CHECKS_ID,
        fallback_admin_id: ADMIN_ID,
        order_id: orderId,
      })

      const fallbackRes = await sendCheck(ADMIN_ID, orderId, caption, file)
      if (fallbackRes.ok) {
        return NextResponse.json({ success: true, fallback: 'admin' })
      }

      throw new Error(`Telegram fallback upload error: ${await fallbackRes.text()}`)
    }

    throw new Error(`Telegram check upload error: ${errorText}`)
  } catch (error) {
    console.error('Checks API error:', error)
    await notifyAdminError('Checks API error', error)
    return NextResponse.json({ error: 'Chek yuborishda xato yuz berdi' }, { status: 500 })
  }
}
