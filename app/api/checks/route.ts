import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { notifyAdminError } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.BOT_TOKEN!
const GROUP_CHECKS_ID = process.env.GROUP_CHECKS_ID || '-1003912030329'
const ADMIN_ID = process.env.GLAVNIY_ADMIN_ID || '8156792282'
const MAX_CHECK_SIZE = 10 * 1024 * 1024

function checkActionsKeyboard(orderId: string) {
  return {
    inline_keyboard: [[
      { text: 'Chekni tasdiqlash', callback_data: `check_confirm_${orderId}` },
      { text: 'Rad etish', callback_data: `check_reject_${orderId}` },
    ]],
  }
}

function validateCheckFile(file: File) {
  const isAllowedType = file.type.startsWith('image/') || file.type === 'application/pdf'
  if (!isAllowedType) return "Chek rasm yoki PDF formatida bo'lishi kerak"
  if (file.size > MAX_CHECK_SIZE) return "Chek fayli 10 MB dan kichik bo'lishi kerak"
  return ''
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

    const validationError = validateCheckFile(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const caption =
      `<b>YANGI CHEK - Buyurtma #${orderId}</b>\n` +
      `${'-'.repeat(24)}\n` +
      `Mijoz: ${customerName || 'Sayt mijozi'}\n` +
      `Telefon: ${customerPhone || '-'}\n` +
      `Fayl: ${file.name || 'check'}`

    const res = await sendCheck(GROUP_CHECKS_ID, orderId, caption, file)
    if (res.ok) {
      const statusUpdated = await markOrderCheckUploaded(orderId)
      return NextResponse.json({ success: true, status_updated: statusUpdated })
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
        const statusUpdated = await markOrderCheckUploaded(orderId)
        return NextResponse.json({ success: true, fallback: 'admin', status_updated: statusUpdated })
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

async function markOrderCheckUploaded(orderId: string) {
  const id = Number(orderId)
  if (!Number.isFinite(id) || !process.env.DATABASE_URL) return false

  try {
    const columns = await getTableColumns('orders')
    if (!columns.has('id')) return false

    const updates: string[] = []
    const values: Array<string | number> = []
    const addValue = (value: string | number) => {
      values.push(value)
      return `$${values.length}`
    }

    if (columns.has('status')) {
      updates.push(`status = ${addValue(await getEnumCompatibleValue('orders', 'status', 'CHEK_YUBORILDI'))}`)
    }
    if (columns.has('payment_status')) {
      updates.push(`payment_status = ${addValue(await getEnumCompatibleValue('orders', 'payment_status', 'CHEK_YUBORILDI'))}`)
    }
    if (columns.has('check_status')) {
      updates.push(`check_status = ${addValue(await getEnumCompatibleValue('orders', 'check_status', 'CHEK_YUBORILDI'))}`)
    }
    for (const column of ['check_uploaded_at', 'receipt_uploaded_at', 'payment_receipt_uploaded_at']) {
      if (columns.has(column)) updates.push(`${column} = NOW()`)
    }
    if (columns.has('updated_at')) updates.push('updated_at = NOW()')

    if (!updates.length) return false

    values.push(id)
    await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${values.length}`, values)
    return true
  } catch (error) {
    console.error('Order check status update failed:', error)
    await notifyAdminError('Order check status update failed', error, { order_id: orderId })
    return false
  }
}

async function getTableColumns(tableName: string) {
  const { rows } = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  )
  return new Set(rows.map((row) => row.column_name))
}

async function getEnumCompatibleValue(tableName: string, columnName: string, value: string) {
  const { rows } = await pool.query<{ enumlabel: string }>(
    `SELECT e.enumlabel
     FROM pg_attribute a
     JOIN pg_class c ON c.oid = a.attrelid
     JOIN pg_type t ON t.oid = a.atttypid
     JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE c.relname = $1 AND a.attname = $2
     ORDER BY e.enumsortorder`,
    [tableName, columnName]
  )

  const labels = rows.map((row) => row.enumlabel)
  if (!labels.length) return value
  if (labels.includes(value)) return value
  if (labels.includes(value.toUpperCase())) return value.toUpperCase()
  if (labels.includes('CHEK_YUBORILDI')) return 'CHEK_YUBORILDI'
  if (labels.includes('TOLOV_KUTILMOQDA')) return 'TOLOV_KUTILMOQDA'
  if (labels.includes('TASDIQLANDI')) return 'TASDIQLANDI'
  if (labels.includes('pending')) return 'pending'
  if (labels.includes('paid')) return 'paid'
  return labels[0]
}
