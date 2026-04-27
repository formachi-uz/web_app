import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/crud'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const categoryIdParam = searchParams.get('category')
    const categoryId = categoryIdParam ? Number(categoryIdParam) : undefined

    const products = await getProducts({
      categoryId,
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Products API error:', error)

    return NextResponse.json(
      { error: 'Mahsulotlarni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
