import { NextRequest, NextResponse } from 'next/server'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.BOT_TOKEN!
const GROUP_CHECKS_ID = process.env.GROUP_CHECKS_ID || '-1003912030329'

function checkActionsKeyboard(orderId: string) {
  return {
    inline_keyboard: [[
      { text: '✅ Chekni tasdiqlash', callback_data: `check_confirm_${orderId}` },
      { text: '❌ Rad etish', callback_data: `check_reject_${orderId}` },
    ]],
  }
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

    const telegramForm = new FormData()
    telegramForm.append('chat_id', GROUP_CHECKS_ID)
    telegramForm.append('caption', caption)
    telegramForm.append('parse_mode', 'HTML')
    telegramForm.append('reply_markup', JSON.stringify(checkActionsKeyboard(orderId)))
    telegramForm.append(file.type.startsWith('image/') ? 'photo' : 'document', file, file.name || 'check')

    const method = file.type.startsWith('image/') ? 'sendPhoto' : 'sendDocument'
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      body: telegramForm,
    })

    if (!res.ok) {
      throw new Error(`Telegram check upload error: ${await res.text()}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Checks API error:', error)
    await notifyAdminError('Checks API error', error)
    return NextResponse.json({ error: 'Chek yuborishda xato yuz berdi' }, { status: 500 })
  }
}
