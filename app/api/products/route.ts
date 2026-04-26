import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('category')
      ? parseInt(searchParams.get('category')!)
      : undefined
    const products = await getProducts(categoryId)
    return NextResponse.json(products)
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
