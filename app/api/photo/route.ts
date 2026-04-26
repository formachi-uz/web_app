import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('file_id')
  if (!fileId) {
    return new NextResponse('file_id kerak', { status: 400 })
  }

  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) {
    return new NextResponse('BOT_TOKEN yo\'q', { status: 500 })
  }

  try {
    // File path olish
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    )
    const fileData = await fileRes.json()

    if (!fileData.ok) {
      return new NextResponse('Fayl topilmadi', { status: 404 })
    }

    const filePath = fileData.result.file_path
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`

    // Rasmni olish va qaytarish
    const photoRes = await fetch(photoUrl)
    const photoBuffer = await photoRes.arrayBuffer()
    const contentType = photoRes.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(photoBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 1 kun cache
      },
    })
  } catch (error) {
    console.error('Photo proxy error:', error)
    return new NextResponse('Xato', { status: 500 })
  }
}
